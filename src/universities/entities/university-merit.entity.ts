import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { University } from './university.entity';

@Entity('university_merits')
export class UniversityMerit {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => University, (university) => university.meritList, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'university_id' })
  university: University;

  @Column()
  degree: string;

  @Column({ name: 'last_year_closing_merit', type: 'numeric', precision: 5, scale: 2 })
  lastYearClosingMerit: number;
}
