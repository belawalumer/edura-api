import { GradeSubject } from '../../grade-subjects/entities/grade-subject.entity';
import { Status } from '../../common/enums';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('grades')
export class Grade {
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

  @OneToMany(() => GradeSubject, (gs) => gs.grade)
  gradeSubjects: GradeSubject[];
}
