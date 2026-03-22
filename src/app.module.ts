import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AgentsModule } from './agents/agents.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProvidersModule } from './providers/providers.module';
import { ModelsModule } from './models/models.module';
import { TasksModule } from './tasks/tasks.module';
import { ProjectsModule } from './projects/projects.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: process.env.DATABASE_URL ? 'postgres' : 'sqlite',
      database: process.env.DATABASE_URL
        ? undefined
        : join(process.cwd(), 'local.sqlite'),
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true, // Use only in development
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'ui', 'dist'),
    }),
    AgentsModule,
    ProvidersModule,
    ModelsModule,
    TasksModule,
    ProjectsModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
