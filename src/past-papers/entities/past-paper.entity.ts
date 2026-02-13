import { Status } from '../../common/enums';
import { Grade } from '../../grades/entities/grade.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ExamCategory } from './exam-category.entity';

@Entity('past_papers')
export class PastPaper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ExamCategory, { eager: true })
  category: ExamCategory;

  @ManyToOne(() => Grade, { eager: true })
  grade: Grade;

  @ManyToOne(() => Subject, { eager: true })
  subject: Subject;

  @Column()
  year: number;

  @Column({ type: 'text' })
  file_url: string;

  @Column({ type: 'enum', enum: Status, default: Status.ACTIVE })
  status: Status;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
