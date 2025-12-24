import { Chapter } from '../../chapters/entities/chapter.entity';
import { Grade } from '../../grades/entities/grade.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import {
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('grade-subjects')
@Unique(['grade', 'subject'])
export class GradeSubject {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Grade, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'grade_id' })
  grade: Grade;

  @ManyToOne(() => Subject, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @OneToMany(() => Chapter, (chapter) => chapter.gradeSubject)
  chapters: Chapter[];
}
