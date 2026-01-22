import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TestAttempt } from './test_attempt.entity';
import { Question } from './question.entity';

@Entity('user_answers')
export class UserAnswer {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TestAttempt, (ta) => ta.answers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'test_attempt_id' })
  testAttempt: TestAttempt;

  @ManyToOne(() => Question, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ type: 'int', nullable: true })
  selected_option_id: number | null;

  @Column({ type: 'boolean', nullable: true })
  isCorrect: boolean | null;
}
