import { Controller, Get, Req, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../auth.service';
import { Request, Response } from 'express';

@Controller('auth/google')
export class GoogleAuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const user = req.user;
    const token = await this.authService.googleLogin(user);
    return res.redirect(`http://localhost:3000?token=${token}`);
  }
}
