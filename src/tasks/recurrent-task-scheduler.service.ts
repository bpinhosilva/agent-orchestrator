import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import {
  RecurrentTask,
  RecurrentTaskStatus,
} from './entities/recurrent-task.entity';
import {
  RecurrentTaskExec,
  ExecStatus,
} from './entities/recurrent-task-exec.entity';
import { AgentsService } from '../agents/agents.service';

@Injectable()
export class RecurrentTaskSchedulerService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(RecurrentTaskSchedulerService.name);
  private runningTasks = new Map<
    string,
    { execId: string; startTime: number }
  >();
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(RecurrentTask)
    private readonly recurrentTaskRepository: Repository<RecurrentTask>,
    @InjectRepository(RecurrentTaskExec)
    private readonly execRepository: Repository<RecurrentTaskExec>,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly agentsService: AgentsService,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Initializing Recurrent Task Scheduler...');
    // Sync cron jobs periodically (e.g., every 15 seconds) to handle DB changes
    this.syncInterval = setInterval(() => {
      void this.registerActiveTasks();
    }, 15000);
    await this.registerActiveTasks();
  }

  onModuleDestroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  public unregisterTasks(taskId: string) {
    const jobName = `recurrent-task-${taskId}`;
    if (this.schedulerRegistry.doesExist('cron', jobName)) {
      const job = this.schedulerRegistry.getCronJob(jobName);
      void job.stop();
      this.schedulerRegistry.deleteCronJob(jobName);
      this.logger.debug(
        `Explicitly unregistered and stopped cron job for task ${taskId}`,
      );
    }
  }

  private async registerActiveTasks() {
    const activeTasks = await this.recurrentTaskRepository.find({
      where: { status: RecurrentTaskStatus.ACTIVE },
      relations: ['assignee'],
    });

    // Remove existing jobs that are no longer active
    const activeTaskIds = new Set(activeTasks.map((t) => t.id));
    const currentJobs = this.schedulerRegistry.getCronJobs();
    for (const [name, job] of currentJobs.entries()) {
      if (name.startsWith('recurrent-task-')) {
        const taskId = name.replace('recurrent-task-', '');
        const task = activeTasks.find((t) => t.id === taskId);

        // If task is no longer active, or cron expression changed, stop and delete
        const jobWithCron = job as unknown as {
          stop: () => void;
          cronTime: { source: string };
        };
        if (
          !activeTaskIds.has(taskId) ||
          (task &&
            jobWithCron.cronTime &&
            jobWithCron.cronTime.source !== task.cronExpression)
        ) {
          void job.stop();
          this.schedulerRegistry.deleteCronJob(name);
        }
      }
    }

    // Register missing active ones
    for (const task of activeTasks) {
      if (!task.cronExpression) continue;

      const jobName = `recurrent-task-${task.id}`;
      if (!this.schedulerRegistry.doesExist('cron', jobName)) {
        try {
          const job = new CronJob(task.cronExpression, () => {
            void this.executeTask(task.id);
          });

          this.schedulerRegistry.addCronJob(jobName, job);
          job.start();
          this.logger.debug(
            `Registered cron job for recurrent task ${task.title} (${task.id})`,
          );
        } catch {
          this.logger.error(
            `Invalid cron expression for task ${task.id}: ${task.cronExpression}`,
          );
        }
      }
    }
  }

  async executeTask(taskId: string) {
    const running = this.runningTasks.get(taskId);
    if (running) {
      const elapsed = Date.now() - running.startTime;
      if (elapsed > 120000) {
        // 2 minutes
        this.logger.warn(`Task ${taskId} running for > 2 mins. Canceling.`);
        await this.execRepository.update(running.execId, {
          status: ExecStatus.CANCELED,
          result: 'Canceled due to timeout (> 2 mins)',
          latencyMs: elapsed,
        });
        this.runningTasks.delete(taskId);
      } else {
        this.logger.debug(
          `Task ${taskId} is already running. Skipping execution.`,
        );
        return; // skip execution and let it finish
      }
    }

    const task = await this.recurrentTaskRepository.findOne({
      where: { id: taskId },
      relations: ['assignee'],
    });

    if (!task || task.status !== RecurrentTaskStatus.ACTIVE || !task.assignee) {
      return;
    }

    const exec = this.execRepository.create({
      recurrentTask: task,
      status: ExecStatus.RUNNING,
    });
    const savedExec = await this.execRepository.save(exec);

    this.runningTasks.set(taskId, {
      execId: savedExec.id,
      startTime: Date.now(),
    });

    try {
      this.logger.debug(
        `Agent ${task.assignee.name} performing recurrent task ${task.title}`,
      );

      const response = await this.agentsService.probe(
        task.assignee.id,
        `### Recurrent Task Execution\n\n[CONTEXT]\nTitle: ${task.title}\nDescription: ${task.description}\n[/CONTEXT]\n\nPlease perform the task described above.`,
      );

      const latencyMs = Date.now() - this.runningTasks.get(taskId)!.startTime;

      await this.execRepository.update(savedExec.id, {
        status: ExecStatus.SUCCESS,
        result: response.content,
        latencyMs,
      });
    } catch (error: unknown) {
      const latencyMs = Date.now() - this.runningTasks.get(taskId)!.startTime;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to execute recurrent task ${taskId}: ${message}`,
      );
      await this.execRepository.update(savedExec.id, {
        status: ExecStatus.FAILURE,
        result: message,
        latencyMs,
      });
    } finally {
      this.runningTasks.delete(taskId);
    }
  }
}
