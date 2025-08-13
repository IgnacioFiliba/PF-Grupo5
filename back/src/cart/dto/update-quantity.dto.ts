import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateQuantityDto {
  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  quantity: number; // 0 = eliminar
}