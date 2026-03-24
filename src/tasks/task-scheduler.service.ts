import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Project, ProjectStatus } from '../projects/entities/project.entity';
import { Task, TaskStatus } from './entities/task.entity';
import { AgentsService } from '../agents/agents.service';
import { TaskComment, CommentAuthorType } from './entities/comment.entity';
import { AgentEntity } from '../agents/entities/agent.entity';

@Injectable()
export class TaskSchedulerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(TaskSchedulerService.name);

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(TaskComment)
    private readonly commentRepository: Repository<TaskComment>,
    private readonly agentsService: AgentsService,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Task Scheduler initialized. First run starting...');
    await this.handleTaskScheduling();
  }

  @Cron('*/45 * * * * *')
  async handleTaskScheduling() {
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
    const MAX_TASKS_PER_RUN = 50; // Safety limit to prevent infinite loops in a single scheduler run

    while (hasMoreTasks && iterationCount < MAX_TASKS_PER_RUN) {
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

Please return a JSON in this exact shape: {"agentId": "id-of-the-selected-agent"}
If no agent is suitable, return your own ID: "${ownerAgent.id}".
`;

    try {
      const response = await this.agentsService.processRequest(
        ownerAgent.id,
        prompt,
      );
      let selectedAgentId = ownerAgent.id;

      try {
        const cleanedContent = response.content
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        const jsonResponse = JSON.parse(cleanedContent) as { agentId?: string };
        if (jsonResponse.agentId) {
          selectedAgentId = jsonResponse.agentId;
        }
      } catch {
        this.logger.warn(
          `Owner agent for project ${project.id} returned invalid JSON: ${response.content}. Falling back to owner.`,
        );
      }

      const assignedAgent =
        allAgents.find((a) => a.id === selectedAgentId) || ownerAgent;
      task.assignee = assignedAgent;
      // We don't necessarily want to change status to in-progress here because the flow says assign and proceed.
      // But if we stayed in backlog, the next loop iteration (in the same scheduler call) would pick it up and call performTask.
      // This is exactly what we want.

      await this.taskRepository.save(task);
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

      task.status = TaskStatus.REVIEW;
      task.output = response.content;
      task.llm_latency = latency;
      task.cost_estimate = (task.cost_estimate || 0) + iterationCost;

      await this.taskRepository.save(task);

      const comment = this.commentRepository.create({
        content: response.content,
        task: task,
        authorAgent: task.assignee,
        authorType: CommentAuthorType.AGENT,
      });
      await this.commentRepository.save(comment);

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
