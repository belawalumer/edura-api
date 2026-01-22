import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createClient } from '@supabase/supabase-js';
import { Request } from 'express';
import { User } from '../../user/entities/user.entity';
import * as jwt from 'jsonwebtoken';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from 'src/common/enums';
import { generateRefreshToken } from '../helpers/token.helper';

export interface AuthUser {
  id?: number;
  email: string;
  role: string;
  phone?: string;
  name?: string;
  image?: string;
}

export interface JwtPayload {
  id: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface RequestWithUser extends Request {
  user?: AuthUser;
}

@Injectable()
export class AuthGuard implements CanActivate {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    let user!: AuthUser;

    try {
      const secret = process.env.APP_SECRET;
      if (!secret)
        throw new UnauthorizedException(
          'Server misconfiguration: APP_SECRET not set'
        );
      const decoded = jwt.verify(token, secret) as JwtPayload;
      const dbUser = await this.userRepo.findOneBy({ id: decoded.id });
      if (!dbUser) throw new UnauthorizedException('User not found');

      user = {
        id: dbUser.id,
        email: dbUser.email,
        phone: dbUser.phone,
        role: dbUser.role,
      };
    } catch (err: any) {
      const e = err as { name?: string };
      if (e.name === 'TokenExpiredError' || e.name === 'JsonWebTokenError') {
        const { data, error } = await this.supabase.auth.getUser(token);

        if (error || !data.user?.email) {
          throw new UnauthorizedException('Invalid token');
        }

        const email = data.user.email;
        let dbUser = await this.userRepo.findOneBy({ email });

        if (!dbUser) {
          dbUser = this.userRepo.create({
            email,
            role: UserRole.USER,
            phone: data.user.phone,
            name: String(data.user.user_metadata?.full_name || email),
            image: data.user.user_metadata?.avatar_url
              ? String(data.user.user_metadata.avatar_url)
              : undefined,
            refreshToken: generateRefreshToken(),
          });
          await this.userRepo.save(dbUser);
        }

        user = {
          id: dbUser.id,
          email: dbUser.email,
          phone: dbUser.phone,
          role: dbUser.role,
          name: dbUser.name,
          image: dbUser.image ?? undefined,
        };
      } else {
        throw err;
      }
    }

    const roles =
      this.reflector.get<string[]>('roles', context.getHandler()) || [];
    if (roles.length && !roles.includes(user.role)) {
      throw new ForbiddenException('Access denied');
    }

    req.user = user;
    return true;
  }
}
