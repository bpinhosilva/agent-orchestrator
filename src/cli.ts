#!/usr/bin/env node
import { Command } from 'commander';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const program = new Command();

program
  .name('agent-orchestrator')
  .description('An open-source AI agent orchestrator platform')
  .version('0.0.1');

program
  .command('run')
  .description('Start the orchestrator server')
  .action(async () => {
    console.log('Starting Agent Orchestrator...');
    const app = await NestFactory.create(AppModule);
    await app.listen(process.env.PORT ?? 3000);
    console.log(`Orchestrator is running on: ${await app.getUrl()}`);
  });

program.parse(process.argv);
