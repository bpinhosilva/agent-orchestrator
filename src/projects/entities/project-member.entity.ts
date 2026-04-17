import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  Index,
} from 'typeorm';
import { Project } from './project.entity';
import { User } from '../../users/entities/user.entity';

export enum ProjectMemberRole {
  OWNER = 'owner',
  MEMBER = 'member',
}

@Entity('project_members')
@Unique(['project', 'user'])
export class ProjectMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, (project) => project.members, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  project: Project;

  @Index()
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE', eager: true })
  user: User;

  @Column({ type: 'varchar', default: ProjectMemberRole.MEMBER })
  role: ProjectMemberRole;

  @CreateDateColumn()
  createdAt: Date;
}
