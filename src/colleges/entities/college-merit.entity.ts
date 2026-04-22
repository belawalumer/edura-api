import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { College } from './college.entity';

@Entity('college_merits')
export class CollegeMerit {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => College, (college) => college.meritList, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'college_id' })
  college: College;

  @Column()
  degree: string;

  @Column({ name: 'last_year_closing_merit', type: 'numeric', precision: 5, scale: 2 })
  lastYearClosingMerit: number;
}
