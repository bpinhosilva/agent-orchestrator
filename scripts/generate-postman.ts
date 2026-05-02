import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import * as path from 'path';
import {
  convertOpenApiToPostman,
  type OpenApiToPostmanConverter,
  writePostmanCollection,
} from '../src/common/postman/postman-conversion';

// Using require since openapi-to-postmanv2 often lacks TS types out of the box
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Converter = require('openapi-to-postmanv2') as {
  convert: OpenApiToPostmanConverter;
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api/v1');

  try {
    const config = new DocumentBuilder()
      .setTitle('Agent Orchestrator API')
      .setDescription('The core API for the Agent Orchestrator platform')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    const openApiJsonStr = JSON.stringify(document);
    const collection = await convertOpenApiToPostman(
      openApiJsonStr,
      Converter.convert,
    );
    const outputPath = path.join(
      __dirname,
      '..',
      'agent-orchestrator.postman_collection.json',
    );

    writePostmanCollection(outputPath, collection);
    console.log(
      `\n✅ Postman Collection successfully generated at: ${outputPath}\n`,
    );
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
