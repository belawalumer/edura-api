import { UserRole } from '../../common/enums/index';
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

  @Column({ type: 'varchar', nullable: true, unique: true })
  phone?: string | null;

  @Column({ type: 'varchar', nullable: true })
  countryCode?: string | null;

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

  @Column({ type: 'varchar', nullable: true })
  refreshToken?: string | null;

  @Column({ nullable: true })
  grade?: string;

  @Column({ default: false })
  isSuspended: boolean;

  @Column({ type: 'int', default: 0 })
  total_coins: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
