import { Injectable, NotFoundException } from '@nestjs/common';
import { AgentEntity } from '../agents/entities/agent.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project, ProjectStatus } from './entities/project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const project = this.projectsRepository.create({
      title: createProjectDto.title,
      description: createProjectDto.description,
      status: createProjectDto.status ?? ProjectStatus.PLANNING,
      defaultAgent: { id: createProjectDto.defaultAgentId } as AgentEntity,
    });
    return this.projectsRepository.save(project);
  }

  async findAll(): Promise<Project[]> {
    return this.projectsRepository.find();
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectsRepository.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.findOne(id);

    if (updateProjectDto.title !== undefined)
      project.title = updateProjectDto.title;
    if (updateProjectDto.description !== undefined)
      project.description = updateProjectDto.description;
    if (updateProjectDto.status !== undefined)
      project.status = updateProjectDto.status;
    if (updateProjectDto.defaultAgentId !== undefined)
      project.defaultAgent = {
        id: updateProjectDto.defaultAgentId,
      } as AgentEntity;

    return this.projectsRepository.save(project);
  }

  async remove(id: string): Promise<void> {
    const project = await this.findOne(id);
    await this.projectsRepository.remove(project);
  }
}
