import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { AgentEntity } from '../agents/entities/agent.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { Project, ProjectStatus } from './entities/project.entity';
import {
  ProjectMember,
  ProjectMemberRole,
} from './entities/project-member.entity';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly memberRepository: Repository<ProjectMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(
    createProjectDto: CreateProjectDto,
    user: User,
  ): Promise<Project> {
    return this.projectsRepository.manager.transaction(async (manager) => {
      const project = manager.create(Project, {
        title: createProjectDto.title,
        description: createProjectDto.description,
        status: createProjectDto.status ?? ProjectStatus.PLANNING,
        ownerAgent: createProjectDto.ownerAgentId
          ? ({ id: createProjectDto.ownerAgentId } as AgentEntity)
          : null,
      });
      const savedProject = await manager.save(project);

      const membership = manager.create(ProjectMember, {
        project: savedProject,
        user: { id: user.id } as User,
        role: ProjectMemberRole.OWNER,
      });
      await manager.save(membership);

      return savedProject;
    });
  }

  async findAll(user: User): Promise<Project[]> {
    if (user.role === UserRole.ADMIN) {
      return this.projectsRepository.find();
    }
    return this.projectsRepository
      .createQueryBuilder('project')
      .innerJoin('project.members', 'pm', 'pm.userId = :userId', {
        userId: user.id,
      })
      .getMany();
  }

  async findOne(id: string, user: User): Promise<Project> {
    const project = await this.projectsRepository.findOne({
      where: { id },
      relations: ['members', 'members.user'],
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    if (user.role !== UserRole.ADMIN) {
      const isMember = project.members.some((m) => m.user.id === user.id);
      if (!isMember) {
        throw new ForbiddenException('Access denied');
      }
    }
    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    user: User,
  ): Promise<Project> {
    return this.projectsRepository.manager.transaction(async (manager) => {
      const project = await manager.findOne(Project, {
        where: { id },
        relations: ['members', 'members.user'],
      });
      if (!project) {
        throw new NotFoundException(`Project with ID ${id} not found`);
      }
      if (user.role !== UserRole.ADMIN) {
        const isMember = project.members.some((m) => m.user.id === user.id);
        if (!isMember) {
          throw new ForbiddenException('Access denied');
        }
      }

      if (updateProjectDto.title !== undefined)
        project.title = updateProjectDto.title;
      if (updateProjectDto.description !== undefined)
        project.description = updateProjectDto.description;
      if (updateProjectDto.status !== undefined)
        project.status = updateProjectDto.status;
      if (updateProjectDto.ownerAgentId !== undefined) {
        project.ownerAgent = updateProjectDto.ownerAgentId
          ? ({ id: updateProjectDto.ownerAgentId } as AgentEntity)
          : null;
      }

      return manager.save(project);
    });
  }

  async remove(id: string, user: User): Promise<void> {
    const project = await this.projectsRepository.findOne({
      where: { id },
      relations: ['members', 'members.user'],
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    if (user.role !== UserRole.ADMIN) {
      const ownership = project.members.find(
        (m) => m.user.id === user.id && m.role === ProjectMemberRole.OWNER,
      );
      if (!ownership) {
        throw new ForbiddenException(
          'Only the project owner can delete this project',
        );
      }
    }
    await this.projectsRepository.remove(project);
  }

  async addMember(
    projectId: string,
    addMemberDto: AddMemberDto,
    user: User,
  ): Promise<ProjectMember> {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ['members', 'members.user'],
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    if (user.role !== UserRole.ADMIN) {
      const ownership = project.members.find(
        (m) => m.user.id === user.id && m.role === ProjectMemberRole.OWNER,
      );
      if (!ownership) {
        throw new ForbiddenException(
          'Only the project owner can manage members',
        );
      }
    }

    const existing = project.members.find(
      (m) => m.user.id === addMemberDto.userId,
    );
    if (existing) {
      throw new ConflictException('User is already a member of this project');
    }

    const targetUser = await this.userRepository.findOne({
      where: { id: addMemberDto.userId },
    });
    if (!targetUser) {
      throw new NotFoundException(
        `User with ID ${addMemberDto.userId} not found`,
      );
    }

    const membership = this.memberRepository.create({
      project: { id: projectId } as Project,
      user: targetUser,
      role: addMemberDto.role ?? ProjectMemberRole.MEMBER,
    });
    return this.memberRepository.save(membership);
  }

  async removeMember(
    projectId: string,
    targetUserId: string,
    user: User,
  ): Promise<void> {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ['members', 'members.user'],
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    if (user.role !== UserRole.ADMIN) {
      const ownership = project.members.find(
        (m) => m.user.id === user.id && m.role === ProjectMemberRole.OWNER,
      );
      if (!ownership) {
        throw new ForbiddenException(
          'Only the project owner can manage members',
        );
      }
    }

    const membership = project.members.find((m) => m.user.id === targetUserId);
    if (!membership) {
      throw new NotFoundException('User is not a member of this project');
    }
    if (membership.role === ProjectMemberRole.OWNER) {
      throw new ForbiddenException('Cannot remove the project owner');
    }

    await this.memberRepository.remove(membership);
  }

  async getMembers(projectId: string, user: User): Promise<ProjectMember[]> {
    const project = await this.findOne(projectId, user);
    return project.members;
  }
}
