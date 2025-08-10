import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { ExcludePasswordInterceptor } from 'src/interceptors/exclude-password.interceptor';
import { Roles } from 'src/interceptors/roles.decorator';
import { Role } from 'src/auth/roles.enum';
import { RolesGuard } from 'src/auth/roles.guard';
import {
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiOperation,
  ApiBody,
} from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@UseInterceptors(ExcludePasswordInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todos los usuarios (solo Admin)' })
  @ApiQuery({ name: 'page', required: false, example: '1' })
  @ApiQuery({ name: 'limit', required: false, example: '10' })
  @Get()
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  findAll(@Query('page') page: string, @Query('limit') limit: string) {
    if (limit && page) {
      return this.usersService.findAll(+page, +limit);
    }
    return this.usersService.findAll();
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario a buscar',
    example: 'ce5eb2ab-ecba-4458-b702-20b4dffbe12f',
  })
  @Get(':id')
  @UseGuards(AuthGuard)
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar usuario por ID (solo Admin)' })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario a actualizar',
    example: '3fa2e8db-e990-450b-9163-067794f02475',
  })
  @ApiBody({
    type: UpdateUserDto,
    examples: {
      ejemploDeActualizacion: {
        summary: 'Ejemplo de actualización',
        value: {
          name: 'Ignacio Modificado',
          email: 'nuevo@example.com',
          city: 'Rosario',
          isAdmin: true,        // <- cambiar a admin
          // isSuperAdmin: false // <- opcional
        },
      },
    },
  })
  @Put(':id')
  @Roles(Role.ADMIN)                 
  @UseGuards(AuthGuard, RolesGuard) 
  update(@Param('id', ParseUUIDPipe) id: string, @Body() user: UpdateUserDto) {
    return this.usersService.update(id, user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar usuario por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario a eliminar',
    example: '171de8b7-a721-4e3b-91e5-9d86960d1f97',
  })
  @Delete(':id')
  @UseGuards(AuthGuard)
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.delete(id);
  }
}