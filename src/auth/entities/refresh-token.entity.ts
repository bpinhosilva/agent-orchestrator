import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { DATETIME_COLUMN_TYPE, UUID_COLUMN_TYPE } from '../../config/typeorm';

@Entity('refresh_tokens')
@Index(['userId', 'expiresAt'])
@Index(['userId', 'revokedAt'])
@Index(['absoluteExpiry'])
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: UUID_COLUMN_TYPE })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'text' })
  token: string;

  @CreateDateColumn()
  issuedAt: Date;

  @Column({ type: DATETIME_COLUMN_TYPE })
  expiresAt: Date;

  @Column({ type: DATETIME_COLUMN_TYPE })
  absoluteExpiry: Date;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: DATETIME_COLUMN_TYPE, nullable: true })
  revokedAt: Date | null;
}
