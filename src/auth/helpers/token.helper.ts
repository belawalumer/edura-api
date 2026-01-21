import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { User } from '../../user/entities/user.entity';
import { ConfigService } from '@nestjs/config';

export function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

export function generateToken(
  user: User,
  configService: ConfigService
): string {
  const secret = configService.get<string>('APP_SECRET');

  if (!secret) {
    throw new Error('APP_SECRET is not configured');
  }

  return jwt.sign({ id: user.id, role: user.role, email: user.email }, secret, {
    expiresIn: '1d',
  });
}
