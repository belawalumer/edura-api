import { Gender } from '../../common/enums';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Job } from './job.entity';

@Entity('job_preferred_candidates')
export class JobPreferredCandidate {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Job, (job) => job.preferredCandidate, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Column()
  years_of_experience: number;

  @Column({ nullable: true })
  required_division: string;

  @Column({
    type: 'enum',
    enum: Gender,
    default: Gender.ANY,
  })
  gender: Gender;

  @Column()
  min_age: number;

  @Column()
  max_age: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
