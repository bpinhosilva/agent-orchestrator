import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, type LogLevel } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import {
  checkPendingMigrations,
  runMigrations,
} from './database/migration-state';
import { getDefaultPort } from './config/port.defaults';
import { getDefaultHost } from './config/host.defaults';
import { isEnvEnabled, loadRuntimeEnv } from './config/runtime-paths';

const logger = new Logger('Bootstrap');

loadRuntimeEnv();

async function ensureDatabaseIsReadyForStartup() {
  if (!isEnvEnabled('CHECK_PENDING_MIGRATIONS_ON_STARTUP')) {
    return;
  }

  const { hasPending } = await checkPendingMigrations();

  if (!hasPending) {
    return;
  }

  const nodeEnv = process.env.NODE_ENV || 'development';

  if (nodeEnv === 'development') {
    logger.log('Pending migrations detected. Running migrations...');
    await runMigrations();
    logger.log('Migrations completed successfully.');
    return;
  }

  throw new Error(
    [
      'Pending database migrations were detected.',
      'Run `agent-orchestrator setup` or `agent-orchestrator migrate --yes` for packaged installs, `npm run migration:run` for local source development, or `docker compose run --rm api dist/cli/index.js migrate --yes` in the Docker stack, then start the server again.',
    ].join(' '),
  );
}

async function bootstrap() {
  await ensureDatabaseIsReadyForStartup();

  const nodeEnv = process.env.NODE_ENV || 'development';
  const defaultLevels: LogLevel[] =
    nodeEnv === 'production'
      ? ['fatal', 'error']
      : ['fatal', 'error', 'warn', 'log', 'debug', 'verbose'];

  let logLevels: LogLevel[] = defaultLevels;
  const envLogLevel = process.env.LOG_LEVEL as LogLevel | undefined;

  if (envLogLevel) {
    const allLevels: LogLevel[] = [
      'fatal',
      'error',
      'warn',
      'log',
      'debug',
      'verbose',
    ];
    const levelIndex = allLevels.indexOf(envLogLevel);
    if (levelIndex !== -1) {
      logLevels = allLevels.slice(0, levelIndex + 1);
    }
  }

  const app = await NestFactory.create(AppModule, {
    logger: logLevels,
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  // Apply Helmet with a tuned CSP:
  // - Swagger UI needs inline scripts/styles and data: URIs for its assets
  // - React SPA served from the same origin is covered by 'self'
  // - API responses are JSON; no script execution needed from API paths
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"], // required by Swagger UI
          styleSrc: ["'self'", "'unsafe-inline'", 'https:'], // Swagger loads Google Fonts
          imgSrc: ["'self'", 'data:', 'https:'], // Swagger uses data: URIs for images
          fontSrc: ["'self'", 'https:', 'data:'],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false, // Swagger UI loads cross-origin resources
    }),
  );

  // Parse cookies
  app.use(cookieParser());

  // Configure CORS from ALLOWED_ORIGINS env var, falling back to safe defaults
  const configService = app.get(ConfigService);
  const allowedOrigins = configService.get<string>('ALLOWED_ORIGINS');
  const corsOptions: CorsOptions = {
    credentials: true,
  };

  if (allowedOrigins) {
    corsOptions.origin = allowedOrigins.split(',').map((o) => o.trim());
  } else if (nodeEnv === 'development') {
    corsOptions.origin = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://localhost',
      'https://agent-orchestrator.localhost',
    ];
  } else {
    // In production without explicit ALLOWED_ORIGINS, deny cross-origin requests
    corsOptions.origin = false;
  }

  app.enableCors(corsOptions);

  const port = configService.get<number>('PORT') || getDefaultPort(nodeEnv);
  const host = configService.get<string>('HOST') || getDefaultHost(nodeEnv);

  // Only enable Swagger in non-production environments
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Agent Orchestrator API')
      .setDescription('The core API for the Agent Orchestrator platform')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  await app.listen(port, host);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap().catch((err: Error) => {
  logger.error('Application failed to start', err.stack);
  process.exit(1);
});
