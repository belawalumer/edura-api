import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Test } from './test.entity';
import { TestStatus } from '../../common/enums';
import { UserAnswer } from './user_answers.entity';
import { AttemptedQuestion } from './attempted_questions.entity';

@Entity('test_attempts')
export class TestAttempt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  user_id: number;

  @ManyToOne(() => Test, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'test_id' })
  test: Test;

  @Column({ type: 'int', default: 1 })
  attempt_count: number;

  @Column({ type: 'timestamp' })
  start_time: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_time: Date;

  @Column({ type: 'float', default: 0 })
  marks: number;

  @Column({ type: 'int', default: 0 })
  total_correct: number;

  @Column({ type: 'int', default: 0 })
  total_wrong: number;

  @Column({
    type: 'enum',
    enum: TestStatus,
    enumName: 'test_status_enum',
    default: TestStatus.IN_PROGRESS,
  })
  status: TestStatus;

  @Column({ type: 'int', nullable: true })
  remaining_duration: number;

  @OneToMany(() => UserAnswer, (ua) => ua.testAttempt, {
    cascade: ['insert'],
  })
  answers: UserAnswer[];

  @OneToMany(() => AttemptedQuestion, (aq) => aq.testAttempt, {
    cascade: ['insert'],
  })
  attemptedQuestions: AttemptedQuestion[];

  @CreateDateColumn()
  created_at: Date;
}
