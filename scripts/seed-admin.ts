import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';

async function bootstrap() {
  const password = process.argv[2];

  if (!password) {
    console.error('Error: Admin password must be provided as a CLI parameter.');
    console.error('Usage: ts-node scripts/seed-admin.ts <password>');
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);

  const adminData = {
    name: 'Admin',
    email: 'admin@agent-orchestrator.local',
    password: password,
  };

  try {
    console.log('Seeding admin user...');
    await authService.register(adminData);
    console.log('Admin user created successfully!');
    console.log('Email: admin@agent-orchestrator.local');
    console.log('Password: [HIDDEN]');
  } catch (error: any) {
    if (error.status === 409) {
      console.log('Admin user already exists.');
    } else {
      console.error('Failed to seed admin user:', error.message);
    }
  } finally {
    await app.close();
  }
}

bootstrap();
