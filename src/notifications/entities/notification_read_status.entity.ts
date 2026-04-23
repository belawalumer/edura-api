import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('notification_read_status')
export class NotificationReadStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  notification_id: string;

  @CreateDateColumn()
  read_at: Date;
}