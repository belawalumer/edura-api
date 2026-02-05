import { IsNotEmpty } from 'class-validator';
import { ContentType, Status } from '../../common/enums';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('banners_announcements')
export class BannersAnnouncement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ContentType,
  })
  type: ContentType;

  @Column({ type: 'timestamp' })
  activeFrom: Date;

  @Column({ type: 'timestamp' })
  activeTill: Date;

  @Column({
    type: 'enum',
    enum: Status,
    enumName: 'status_enum',
    default: Status.ACTIVE,
  })
  status: Status;

  @Column({ nullable: true })
  ctaLink?: string;

  @Column({ nullable: true })
  @IsNotEmpty({ message: 'Image is required' })
  image: string;
}
