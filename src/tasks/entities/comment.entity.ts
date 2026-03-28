import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Task } from './task.entity';
import { AgentEntity } from '../../agents/entities/agent.entity';
import { User } from '../../users/entities/user.entity';

export enum CommentAuthorType {
  USER = 'user',
  AGENT = 'agent',
}

@Entity('task_comments')
@Index(['task', 'createdAt'])
export class TaskComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @ManyToOne(() => Task, (task) => task.comments, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  task: Task;

  @Column({
    type: 'varchar',
    enum: CommentAuthorType,
  })
  authorType: CommentAuthorType;

  @Index()
  @ManyToOne(() => User, {
    nullable: true,
    eager: true,
    onDelete: 'SET NULL',
  })
  authorUser: User | null;

  @Index()
  @ManyToOne(() => AgentEntity, {
    nullable: true,
    eager: true,
    onDelete: 'SET NULL',
  })
  authorAgent: AgentEntity | null;

  @Column({ type: 'simple-json', nullable: true })
  artifacts:
    | {
        id: string;
        originalName: string;
        mimeType: string;
        filePath: string;
      }[]
    | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
