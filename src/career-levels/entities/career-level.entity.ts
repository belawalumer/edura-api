import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('career_levels')
export class CareerLevel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;
}
