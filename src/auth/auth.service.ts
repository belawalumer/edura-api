import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../user/entities/user.entity';
import { generateToken } from './helpers/token.helper';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>
  ) {}

  async login(email: string, password: string) {
    if (email) {
      email = email.trim().toLowerCase();
    }

    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    if (password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new BadRequestException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new BadRequestException('Invalid credentials');

    const accessToken = generateToken(user);

    return {
      message: 'Login successful',
      accessToken,
      refreshToken: user.refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        email: user.email,
        name: user.name,
        image: user.image ?? null,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token required');
    }

    const user = await this.userRepo.findOne({ where: { refreshToken } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const accessToken = generateToken(user);

    return { accessToken };
  }
}
