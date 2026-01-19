import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { User } from '../../user/entities/user.entity';

export function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

export function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.APP_SECRET as string,
    { expiresIn: '7d' }
  );
}
