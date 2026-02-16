import { EmploymentStatus, Status } from '../../common/enums';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { JobPreferredCandidate } from './job_preferred_candidates.entity';
import { Industry } from '../../industries/entities/industry.entity';
import { Department } from '../../departments/entities/department.entity';
import { Location } from '../../locations/entities/location.entity';
import { CareerLevel } from '../../career-levels/entities/career-level.entity';

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @ManyToOne(() => Industry)
  @JoinColumn({ name: 'industry_id' })
  industry: Industry;

  @ManyToOne(() => Department)
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @Column({ nullable: true })
  division: string;

  @Column({ nullable: true })
  district: string;

  @ManyToOne(() => CareerLevel)
  @JoinColumn({ name: 'career_level_id' })
  careerLevel: CareerLevel;

  @Column({ nullable: true })
  degree_level: string;

  @Column({ nullable: true })
  degree_area: string;

  @Column()
  total_positions: number;

  @Column({ nullable: true })
  role: string;

  @Column({ nullable: true })
  project: string;

  @Column({
    type: 'enum',
    enum: EmploymentStatus,
  })
  employment_status: EmploymentStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  monthly_salary: number;

  @Column({ type: 'text', nullable: true })
  job_description: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  level: string;

  @Column({
    type: 'enum',
    enum: Status,
    default: Status.ACTIVE,
  })
  status: Status;

  @Column({ type: 'date' })
  job_posted: Date;

  @Column({ type: 'date' })
  last_date_to_apply: Date;

  @OneToOne(
    () => JobPreferredCandidate,
    (preferredCandidate) => preferredCandidate.job,
    { cascade: true }
  )
  preferredCandidate: JobPreferredCandidate;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
