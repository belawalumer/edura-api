import { GradeSubject } from '../../grade-subjects/entities/grade-subject.entity';
import { Status } from '../../common/enums';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('chapters')
export class Chapter {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: Status,
    enumName: 'status_enum',
    default: Status.ACTIVE,
  })
  status: Status;

  @ManyToOne(() => GradeSubject, (gs) => gs.chapters, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'grade_subject_id' })
  gradeSubject: GradeSubject;
}
