import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
const { prompt } = require('enquirer');

async function bootstrap() {
  // We use createApplicationContext for a "headless" app context (no HTTP server)
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  
  const configService = app.get(ConfigService);
  const authService = app.get(AuthService);
  const usersService = app.get(UsersService);

  const databaseUrl = configService.get<string>('DATABASE_URL');
  const dbType = configService.get<string>('DB_TYPE');

  // Check for database existence/configuration
  if (!databaseUrl && dbType !== 'postgres') {
    const sqlitePath = path.join(process.cwd(), 'local.sqlite');
    if (!fs.existsSync(sqlitePath)) {
      console.error(`\n❌ Error: Database not found.`);
      console.error(`Neither DATABASE_URL is defined nor 'local.sqlite' exists in the root directory.`);
      console.error(`Please specify a database or run the migrations first.\n`);
      await app.close();
      process.exit(1);
    }
    console.log(`Using local SQLite database: ${sqlitePath}`);
  } else if (databaseUrl) {
    console.log(`Using database from DATABASE_URL.`);
  }

  try {
    const response = await prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Admin name:',
        initial: 'admin',
      },
      {
        type: 'input',
        name: 'email',
        message: 'Admin email:',
        initial: 'admin@agent-orchestrator.local',
      },
      {
        type: 'password',
        name: 'password',
        message: 'Admin password:',
        validate: (value: string) => value.length >= 8 || 'Password must be at least 8 characters long',
      },
    ]);

    const { name, email, password } = response;

    const existingUser = await usersService.findByEmail(email);
    if (existingUser) {
      console.error(`\n❌ Error: User with email ${email} already exists.\n`);
      await app.close();
      process.exit(1);
    }

    await authService.register({
      name,
      email,
      password,
    });

    console.log(`\n✅ Admin user successfully seeded: ${email}\n`);
  } catch (error) {
    if (error === '') {
      // User cancelled with Ctrl+C
      console.log('\nOperation cancelled.');
    } else {
      console.error('\n❌ An error occurred during seeding:', error.message || error);
    }
  } finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap();
