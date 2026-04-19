import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join, basename, dirname } from 'path';
import { AgentsModule } from './agents/agents.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProvidersModule } from './providers/providers.module';
import { ModelsModule } from './models/models.module';
import { TasksModule } from './tasks/tasks.module';
import { ProjectsModule } from './projects/projects.module';
import { UsersModule } from './users/users.module';
import { CommonModule } from './common/common.module';
import { UploadsModule } from './uploads/uploads.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { envValidationSchema } from './config/env.validation';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { SystemSettingsModule } from './system-settings/system-settings.module';
import { getTypeOrmConfig } from './config/typeorm';
import {
  getRuntimeEnvPath,
  isEnvEnabled,
  loadRuntimeEnv,
} from './config/runtime-paths';

loadRuntimeEnv();

const ENV_PATH = getRuntimeEnvPath();
const shouldServeStaticUi = isEnvEnabled('SERVE_STATIC_UI', true);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      envFilePath: ENV_PATH,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('THROTTLE_TTL') || 60000,
          limit: config.get('THROTTLE_LIMIT') || 60,
        },
      ],
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const baseConfig = getTypeOrmConfig(configService);
        return {
          ...baseConfig,
          entities: [], // Important: Use empty array here so autoLoadEntities can work without duplication
          autoLoadEntities: true,
          synchronize: baseConfig.synchronize,
          migrationsRun: false,
        };
      },
    }),
    ...(shouldServeStaticUi
      ? [
          ServeStaticModule.forRoot({
            rootPath:
              process.env.NODE_ENV === 'production'
                ? join(__dirname, 'ui')
                : join(__dirname, '..', 'ui', 'dist'),
            serveStaticOptions: {
              // @nestjs/serve-static passes `null` options to res.sendFile, which causes
              // the `send` module to split the absolute indexFilePath into parts and check
              // each segment for dotfiles (dotfiles:'ignore' by default). When the package is
              // installed under a dotfile directory (e.g. ~/.nvm), this returns 404 for every
              // SPA route. Fix: intercept the call and switch to root+relative form so only
              // 'index.html' is checked — no dotfile segments, no relaxed dotfile policy.

              setHeaders: (res: any) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                const original = res.sendFile as (
                  path: string,
                  opts: unknown,
                  cb: unknown,
                ) => void;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                res.sendFile = function (
                  path: string,
                  opts: unknown,
                  cb: unknown,
                ): void {
                  original.call(
                    this,
                    basename(path),
                    opts === null ? { root: dirname(path) } : opts,
                    cb,
                  );
                };
              },
            },
          }),
        ]
      : []),
    CommonModule,
    UploadsModule,
    AgentsModule,
    ProvidersModule,
    ModelsModule,
    TasksModule,
    ProjectsModule,
    UsersModule,
    AuthModule,
    SystemSettingsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
