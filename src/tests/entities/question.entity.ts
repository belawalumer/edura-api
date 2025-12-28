import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Test } from '../../tests/entities/test.entity';
import { Option } from './option.entity';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @ManyToOne(() => Test, (test) => test.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'test_id' })
  test: Test;

  @OneToMany(() => Option, (option) => option.question, { cascade: true })
  options: Option[];

  @Column({ name: 'correct_option_id', type: 'int', nullable: true })
  correctOptionId: number | null;
}
