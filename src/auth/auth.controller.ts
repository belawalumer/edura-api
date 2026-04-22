import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RefreshTokenDto,
  SignupDto,
  SocialLoginDto,
} from './dto/create-auth.dto';
import { AuthGuard } from './guard/auth_guard';
import type { RequestWithUser } from './guard/auth_guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() body: SignupDto) {
    return this.authService.signup(body);
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Post('refresh-token')
  async refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @Post('social-login')
  async socialLogin(@Body() body: SocialLoginDto) {
    return this.authService.socialLogin(body.token, body.provider);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@Req() req: RequestWithUser) {
    return this.authService.logout(req.user?.id);
  }
}
