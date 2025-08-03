import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Users } from 'src/users/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleAuthController } from './controllers/google.controller';
import { GoogleStrategy } from './strategy/google.strategy';

@Module({
  imports: [TypeOrmModule.forFeature([Users])],
  controllers: [AuthController, GoogleAuthController],
  providers: [AuthService, GoogleStrategy],
})
export class AuthModule {}
