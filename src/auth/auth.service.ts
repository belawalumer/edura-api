import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../user/entities/user.entity';
import { generateRefreshToken, generateToken } from './helpers/token.helper';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createClient } from '@supabase/supabase-js';
import { UserRole } from 'src/common/enums';
import { SignupDto } from './dto/create-auth.dto';

@Injectable()
export class AuthService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>
  ) {}

  async signup(body: SignupDto) {
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();
    const name = body.name?.trim();

    if (!email || !password || !name) {
      throw new BadRequestException('Name, email and password are required');
    }

    if (password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const existingUser = await this.userRepo.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const refreshToken = generateRefreshToken();

    const user = this.userRepo.create({
      name,
      email,
      password: hashedPassword,
      role: UserRole.USER,
      // users.phone is non-nullable and unique in current schema.
      phone: `email-${Date.now()}`,
      refreshToken,
    });

    await this.userRepo.save(user);

    const accessToken = generateToken(user);

    return {
      message: 'Signup successful',
      accessToken,
      refreshToken: user.refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        email: user.email,
        name: user.name,
        image: user.image ?? null,
        grade: user.grade ?? null,
        total_coins: Number(user.total_coins ?? 0),
      },
    };
  }

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
        grade: user.grade ?? null,
        total_coins: Number(user.total_coins ?? 0),
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

  async socialLogin(token: string, provider: 'google' | 'facebook') {
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    const { data, error } = await this.supabase.auth.getUser(token);
    if (error || !data.user?.email) {
      throw new BadRequestException('Invalid social auth token');
    }

    const email = data.user.email.trim().toLowerCase();
    let user = await this.userRepo.findOne({ where: { email } });

    if (!user) {
      user = this.userRepo.create({
        email,
        role: UserRole.USER,
        phone: data.user.phone ?? `${provider}-${Date.now()}`,
        name: String(data.user.user_metadata?.full_name || email),
        image: data.user.user_metadata?.avatar_url
          ? String(data.user.user_metadata.avatar_url)
          : null,
        refreshToken: generateRefreshToken(),
      });
      await this.userRepo.save(user);
    } else if (!user.refreshToken) {
      user.refreshToken = generateRefreshToken();
      await this.userRepo.save(user);
    }

    const accessToken = generateToken(user);

    return {
      message: 'Social login successful',
      accessToken,
      refreshToken: user.refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        email: user.email,
        name: user.name,
        image: user.image ?? null,
        grade: user.grade ?? null,
        total_coins: Number(user.total_coins ?? 0),
      },
    };
  }

  async logout(userId?: number) {
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    await this.userRepo.update({ id: userId }, { refreshToken: null });
    return { message: 'Logout successful' };
  }
}
