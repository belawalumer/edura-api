import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { Chapter } from '../../chapters/entities/chapter.entity';
import { GradeSubject } from '../../grade-subjects/entities/grade-subject.entity';
import { Question } from './question.entity';

@Entity('academic_tests')
export class Test {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'int' })
  total_questions: number;

  @Column({ type: 'int' })
  total_duration: number;

  @ManyToOne(() => Category, { eager: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => GradeSubject, { eager: true })
  @JoinColumn({ name: 'grade_subject_id' })
  gradeSubject: GradeSubject;

  @ManyToOne(() => Chapter, { nullable: true, eager: true })
  @JoinColumn({ name: 'chapter_id' })
  chapter?: Chapter;

  @OneToMany(() => Question, (question) => question.test, { cascade: true })
  questions: Question[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
