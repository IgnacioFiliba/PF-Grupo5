import {
  Body,
  Controller,
  Get,
  Post,
  UseInterceptors,
  Req,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { CreateUserDto, LoginDto } from 'src/users/dto/create-user.dto';
import { AuthService } from './auth.service';
import { ExcludePasswordInterceptor } from 'src/interceptors/exclude-password.interceptor';
import { ApiTags, ApiBody, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from './auth.guard';

@ApiTags('Auth')
@ApiBearerAuth()
@UseInterceptors(ExcludePasswordInterceptor)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @ApiOperation({ summary: 'Mensaje de prueba del endpoint /auth' })
  getAuth() {
    return { message: 'GET /auth' };
  }

  @Post('/register')
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiBody({
    description: 'Datos para registrar un nuevo usuario',
    schema: {
      example: {
        name: 'Ignacio Muestra',
        email: 'muestra@example.com',
        password: 'Muestra123!',
        confirmPassword: 'Muestra123!',
        phone: 3512345678,
        country: 'Argentina',
        address: 'Calle Muestra 123',
        city: 'Córdoba',
      },
    },
  })
  register(@Body() user: CreateUserDto) {
    return this.authService.register(user);
  }

  @Post('/signin')
  @ApiOperation({ summary: 'Iniciar sesión con email y contraseña' })
  @ApiBody({
    description: 'Credenciales para iniciar sesión',
    schema: {
      example: { email: 'admin@example.com', password: 'Admin123!' },
    },
  })
  signIn(@Body() credentials: LoginDto) {
    return this.authService.signIn(credentials);
  }

  @UseGuards(AuthGuard)
  @Post('/logout')
  @HttpCode(204)
  @ApiOperation({ summary: 'Cerrar sesión (borra token en front)' })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  logout(@Req() _req: any) {
    return;
  }
}
