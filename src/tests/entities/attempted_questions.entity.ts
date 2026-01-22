import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { TestAttempt } from './test_attempt.entity';
import { Question } from './question.entity';

@Entity('attempted_questions')
export class AttemptedQuestion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TestAttempt, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'test_attempt_id' })
  testAttempt: TestAttempt;

  @ManyToOne(() => Question, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ type: 'int' })
  question_order: number;
}
