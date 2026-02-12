import { UserRole } from '../../common/enums';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: false, unique: true })
  phone: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ type: 'varchar', nullable: true })
  image?: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    enumName: 'user_role_enum',
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ nullable: true })
  refreshToken?: string;

  @Column({ nullable: true })
  grade?: string;

  @Column({ default: false })
  isSuspended: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
