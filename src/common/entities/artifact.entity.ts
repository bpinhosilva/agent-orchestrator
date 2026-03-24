import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('artifacts')
export class Artifact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column()
  filePath: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, any>;
}
