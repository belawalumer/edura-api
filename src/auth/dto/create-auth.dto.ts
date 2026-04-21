import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ example: 'some-refresh-token' })
  @IsNotEmpty()
  refreshToken: string;
}

export class SocialLoginDto {
  @ApiProperty({ example: 'supabase-access-token' })
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'google' })
  @IsNotEmpty()
  provider: 'google' | 'facebook';
}
