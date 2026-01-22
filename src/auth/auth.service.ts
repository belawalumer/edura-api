import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
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

  async login(phone: string, password: string) {
    if (phone) {
      phone = phone.trim().replace(/\s+/g, '');
    }

    if (!phone || !password) {
      throw new BadRequestException('Phone and password are required');
    }

    const passwordRegex = /^\d{6,8}$/;
    if (!passwordRegex.test(password)) {
      throw new BadRequestException('Password must be 6 to 8 digits');
    }

    const user = await this.userRepo.findOne({ where: { phone } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    const accessToken = generateToken(user);

    return {
      accessToken,
      refreshToken: user.refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        email: user.email,
        name: user.name,
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
