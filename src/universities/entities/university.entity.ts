import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UniversityMerit } from './university-merit.entity';

@Entity('universities')
export class University {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  city: string;

  @OneToMany(() => UniversityMerit, (merit) => merit.university, {
    cascade: true,
  })
  meritList: UniversityMerit[];
}
