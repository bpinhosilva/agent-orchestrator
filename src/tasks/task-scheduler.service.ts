import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Project, ProjectStatus } from '../projects/entities/project.entity';
import { Task, TaskStatus } from './entities/task.entity';
import { AgentsService } from '../agents/agents.service';
import { TaskComment, CommentAuthorType } from './entities/comment.entity';
import { AgentEntity } from '../agents/entities/agent.entity';
import { StorageService } from '../common/storage.service';
import {
  StoragePathHelper,
  StorageContext,
} from '../common/storage-path.helper';
import { TasksService } from './tasks.service';
import { SystemSettingsService } from '../system-settings/system-settings.service';

@Injectable()
export class TaskSchedulerService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(TaskSchedulerService.name);
  private readonly schedulerEnabled: boolean;
  private pollIntervalInMs = 20000;
  private maxTaskPerExecution = 5;
  private intervalRef: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(TaskComment)
    private readonly commentRepository: Repository<TaskComment>,
    private readonly agentsService: AgentsService,
    private readonly storageService: StorageService,
    private readonly storagePathHelper: StoragePathHelper,
    private readonly tasksService: TasksService,
    private readonly configService: ConfigService,
    private readonly systemSettingsService: SystemSettingsService,
  ) {
    this.schedulerEnabled =
      this.configService.get<boolean>('SCHEDULER_ENABLED') !== false;
  }

  async onApplicationBootstrap() {
    if (!this.schedulerEnabled) {
      this.logger.log(
        'Task Scheduler is disabled (SCHEDULER_ENABLED=false). Skipping.',
      );
      return;
    }

    this.logger.log('Task Scheduler initializing. First run starting...');
    await this.handleTaskScheduling();
    this.scheduleInterval();
  }

  onModuleDestroy() {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = null;
    }
  }

  private scheduleInterval() {
    if (this.intervalRef) clearInterval(this.intervalRef);
    this.intervalRef = setInterval(() => {
      void this.handleTaskScheduling();
    }, this.pollIntervalInMs);
  }

  async handleTaskScheduling() {
    if (!this.schedulerEnabled) return;

    const prevInterval = this.pollIntervalInMs;
    try {
      const settings = await this.systemSettingsService.getSettings();
      this.pollIntervalInMs = settings.data.taskScheduler.pollIntervalInMs;
      this.maxTaskPerExecution =
        settings.data.taskScheduler.maxTaskPerExecution;
    } catch (error) {
      this.logger.warn(
        `Could not refresh settings, using current values (pollIntervalInMs=${this.pollIntervalInMs}, maxTaskPerExecution=${this.maxTaskPerExecution}). Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    if (this.pollIntervalInMs !== prevInterval && this.intervalRef !== null) {
      this.logger.log(
        `Poll interval changed from ${prevInterval}ms to ${this.pollIntervalInMs}ms. Rescheduling.`,
      );
      this.scheduleInterval();
    }

    this.logger.debug('Running Task Scheduler job...');

    try {
      // 1) starting by checking projects table, filter those with status active.
      const activeProjects = await this.projectRepository.find({
        where: { status: ProjectStatus.ACTIVE },
        relations: ['ownerAgent'],
      });

      this.logger.debug(`Found ${activeProjects.length} active projects.`);

      // 2) for each project do the following, one by one.
      for (const project of activeProjects) {
        await this.processProject(project);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error in scheduler job: ${errorMessage}`, errorStack);
    }

    this.logger.debug('Task Scheduler job finished.');
  }

  private async processProject(project: Project) {
    this.logger.debug(`Processing project: ${project.title} (${project.id})`);

    // 3) keep track of each project ownerAgent.
    const ownerAgent = project.ownerAgent;
    if (!ownerAgent) {
      this.logger.warn(`Project ${project.id} has no ownerAgent. Skipping.`);
      return;
    }

    // 9) continue doing the jobs until there's no more tasks for the project (after grabbing from database).
    let hasMoreTasks = true;
    let iterationCount = 0;

    while (hasMoreTasks && iterationCount < this.maxTaskPerExecution) {
      // 4) starting querying tasks for that specific project that are in backlog status orded by priority asc (the lesser the higher the priority)
      const tasks = await this.taskRepository.find({
        where: {
          project: { id: project.id },
          status: TaskStatus.BACKLOG,
        },
        order: { priority: 'ASC' },
        relations: ['assignee'],
      });

      if (tasks.length === 0) {
        hasMoreTasks = false;
        continue;
      }

      iterationCount += tasks.length;
      this.logger.debug(
        `Found ${tasks.length} tasks in backlog for project ${project.title}. processing batch.`,
      );

      // Process tasks one by one as they are grabbed from the DB
      for (const task of tasks) {
        // 5) for each task do the following:

        // 6) if a task has no assignee...
        if (!task.assignee) {
          await this.assignTask(task, project, ownerAgent);
        } else {
          // 8) if the task has an assignee...
          await this.performTask(task, project);
        }
      }
    }
  }

  private async assignTask(
    task: Task,
    project: Project,
    ownerAgent: AgentEntity,
  ) {
    this.logger.debug(
      `Assigning task: ${task.title} for project: ${project.title}`,
    );

    // grab available agents (excluding the ownerAgent)
    const allAgents = await this.agentsService.findAll();
    const availableAgents = allAgents.filter(
      (a) => a.id !== ownerAgent.id && a.status !== 'inactive',
    );

    this.logger.debug(
      `Available agents for assignment: ${availableAgents.length}`,
    );

    const agentsList = availableAgents
      .map((a) => `ID: ${a.id}, Role: ${a.role}, Description: ${a.description}`)
      .join('\n');

    const prompt = `
You are the owner of project "${project.title}".
A new task "${task.title}" (Description: ${task.description}) needs to be assigned to an agent.
Available agents are:
${agentsList}

IMPORTANT: You must return ONLY a JSON object in this exact shape: {"agentId": "id-of-the-selected-agent"}
Do not include any other text, explanation, or conversational filler in your response.
If no agent is suitable, return your own ID: "${ownerAgent.id}".
`;

    try {
      const response = await this.agentsService.processRequest(
        ownerAgent.id,
        prompt,
      );
      let selectedAgentId = ownerAgent.id;

      try {
        // Robust JSON extraction
        const content = response.content;
        let jsonStr = '';

        // 1. Try to find content inside markdown code blocks
        const codeBlockMatch = /```(?:json)?\s*([\s\S]*?)\s*```/.exec(content);
        if (codeBlockMatch && codeBlockMatch[1]) {
          jsonStr = codeBlockMatch[1].trim();
        } else {
          // 2. Fallback to finding the first { and last }
          const start = content.indexOf('{');
          const end = content.lastIndexOf('}');
          if (start !== -1 && end !== -1 && end > start) {
            jsonStr = content.substring(start, end + 1);
          }
        }

        if (jsonStr) {
          const jsonResponse = JSON.parse(jsonStr) as { agentId?: string };
          if (jsonResponse.agentId) {
            selectedAgentId = jsonResponse.agentId;
          }
        } else {
          throw new Error('No JSON object found in response');
        }
      } catch (error) {
        this.logger.warn(
          `Owner agent for project ${project.id} returned response that could not be parsed as JSON: ${response.content}. Falling back to owner. Error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      const assignedAgent =
        allAgents.find((a) => a.id === selectedAgentId) || ownerAgent;

      const updatedTask = await this.taskRepository.manager.transaction(
        async (manager) => {
          const t = await manager.findOne(Task, { where: { id: task.id } });
          if (!t) throw new Error(`Task ${task.id} not found for assignment`);
          t.assignee = assignedAgent;
          return manager.save(t);
        },
      );

      this.tasksService.emitTaskEvent(
        { ...updatedTask, project } as Task,
        'updated',
      );
      this.logger.debug(
        `Task ${task.id} assigned to agent: ${assignedAgent.name}`,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error assigning task ${task.id}: ${errorMessage}`);
    }
  }

  private async performTask(task: Task, project: Project) {
    if (!task.assignee) return;

    // Set to in-progress when starting the task
    const inProgressTask = await this.taskRepository.manager.transaction(
      async (manager) => {
        const t = await manager.findOne(Task, { where: { id: task.id } });
        if (!t) throw new Error(`Task ${task.id} not found for execution`);
        t.status = TaskStatus.IN_PROGRESS;
        return manager.save(t);
      },
    );
    this.tasksService.emitTaskEvent(
      { ...inProgressTask, project } as Task,
      'updated',
    );

    this.logger.debug(
      `Agent ${task.assignee.name} performing task ${task.title}`,
    );
    const startTime = Date.now();

    try {
      // 8) invoke its method to perform the task, provide task, project objects.
      const response = await this.agentsService.probe(
        task.assignee.id,
        `Project: ${project.title}. Task: ${task.title}. Description: ${task.description}`,
      );

      const endTime = Date.now();
      const latency = endTime - startTime;

      // Calculate cost estimate if possible
      let iterationCost = 0;
      const usage = response.metadata?.usage as
        | { promptTokenCount?: number; candidatesTokenCount?: number }
        | undefined;

      if (usage) {
        const promptTokens = usage.promptTokenCount || 0;
        const candidateTokens = usage.candidatesTokenCount || 0;

        // Very basic estimate: $0.10/1M input, $0.40/1M output for gemini-2.5-flash-lite
        iterationCost =
          (promptTokens * 0.1) / 1000000 + (candidateTokens * 0.4) / 1000000;
      } else {
        // Fallback estimate if no usage metadata: based on response length
        iterationCost = ((response.content.length / 4) * 0.25) / 1000000;
      }

      // Handle artifacts if present in response
      const artifacts: any[] = [];
      if (response.image) {
        try {
          // Detect if it's base64 (very common for images from LLMs)
          const isBase64 =
            typeof response.image === 'string' &&
            (response.image.startsWith('data:') || response.image.length > 100);

          if (isBase64) {
            const base64Data = response.image.includes('base64,')
              ? response.image.split('base64,')[1]
              : response.image;

            const objectPath = this.storagePathHelper.generate({
              context: StorageContext.TASKS,
              contextId: task.id,
              mimeType: 'image/png',
              originalName: 'generated-image.png',
            });
            await this.storageService.saveBase64(
              base64Data,
              objectPath.mimeType,
              objectPath.filePath,
            );
            artifacts.push(objectPath);
          }
        } catch (error) {
          this.logger.error(
            `Failed to save artifact for task ${task.id}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      const finalTask = await this.taskRepository.manager.transaction(
        async (manager) => {
          const t = await manager.findOne(Task, {
            where: { id: task.id },
            relations: ['assignee'],
          });
          if (!t) throw new Error(`Task ${task.id} not found for final update`);

          t.status = TaskStatus.REVIEW;
          t.llmLatency = latency;
          t.costEstimate = (t.costEstimate || 0) + iterationCost;

          const savedTask = await manager.save(t);

          const comment = manager.create(TaskComment, {
            content: response.content,
            task: savedTask,
            authorAgent: savedTask.assignee,
            authorType: CommentAuthorType.AGENT,
            artifacts: artifacts.length > 0 ? artifacts : null,
          });
          await manager.save(comment);

          return savedTask;
        },
      );

      this.tasksService.emitTaskEvent(
        { ...finalTask, project } as Task,
        'updated',
      );

      this.logger.debug(
        `Task ${task.id} completed by agent ${task.assignee.name}. Latency: ${latency}ms, Cost+: $${iterationCost.toFixed(6)}`,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error performing task ${task.id}: ${errorMessage}`);
    }
  }
}
