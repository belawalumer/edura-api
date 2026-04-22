import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CollegeMerit } from './college-merit.entity';

@Entity('colleges')
export class College {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  city: string;

  @OneToMany(() => CollegeMerit, (merit) => merit.college, { cascade: true })
  meritList: CollegeMerit[];
}
