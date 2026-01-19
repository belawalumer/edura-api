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
import { Question } from './question.entity';
import { Grade } from '../../grades/entities/grade.entity';
import { Subject } from '../../subjects/entities/subject.entity';

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

  @ManyToOne(() => Test, (test) => test.divisions, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_test_id' })
  parentTest?: Test;

  @OneToMany(() => Test, (test) => test.parentTest)
  divisions?: Test[];

  @ManyToOne(() => Category, { eager: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => Grade, { nullable: true, eager: true })
  @JoinColumn({ name: 'grade_id' })
  grade?: Grade;

  @ManyToOne(() => Subject, { nullable: true, eager: true })
  @JoinColumn({ name: 'subject_id' })
  subject?: Subject;

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
