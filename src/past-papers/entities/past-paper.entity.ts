import { ExamCategory } from '../../exam-category/entities/exam-category.entity';
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
  JoinColumn,
} from 'typeorm';

@Entity('past_papers')
export class PastPaper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ExamCategory)
  @JoinColumn({ name: 'category_id' })
  category: ExamCategory;

  @ManyToOne(() => ExamCategory)
  @JoinColumn({ name: 'board_id' })
  board: ExamCategory;

  @ManyToOne(() => Grade)
  @JoinColumn({ name: 'grade_id' })
  grade: Grade;

  @ManyToOne(() => Subject)
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column()
  year: number;

  @Column({ type: 'text' })
  file: string;

  @Column({ type: 'enum', enum: Status, default: Status.ACTIVE })
  status: Status;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
