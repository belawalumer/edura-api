import { Status } from '../../common/enums';
import { Grade } from '../../grades/entities/grade.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({
    type: 'enum',
    enum: Status,
    enumName: 'status_enum',
    default: Status.ACTIVE,
  })
  status: Status;

  @OneToMany(() => Grade, (grade) => grade.category)
  grades: Grade[];
}
