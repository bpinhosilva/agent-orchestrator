import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

// Using require since openapi-to-postmanv2 often lacks TS types out of the box
const Converter = require('openapi-to-postmanv2');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('Agent Orchestrator API')
    .setDescription('The core API for the Agent Orchestrator platform')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const openApiJsonStr = JSON.stringify(document);

  Converter.convert(
    { type: 'string', data: openApiJsonStr },
    { schemaFaker: true }, // Add mock data for parameters if needed
    (err: any, conversionResult: any) => {
      if (!conversionResult.result) {
        console.error('Could not convert', conversionResult.reason);
        process.exit(1);
      } else {
        const collection = conversionResult.output[0].data;
        const outputPath = path.join(__dirname, '..', 'agent-orchestrator.postman_collection.json');
        
        fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2));
        console.log(`\n✅ Postman Collection successfully generated at: ${outputPath}\n`);
        process.exit(0);
      }
    },
  );
}

bootstrap();
