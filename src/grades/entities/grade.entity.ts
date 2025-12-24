import { GradeSubject } from '../../grade-subjects/entities/grade-subject.entity';
import { Category } from '../../categories/entities/category.entity';
import { Status } from '../../common/enums';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

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

  @ManyToOne(() => Category, (category) => category.grades)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => GradeSubject, (gs) => gs.grade)
  gradeSubjects: GradeSubject[];
}
