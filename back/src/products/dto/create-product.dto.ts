import { IsNotEmpty, IsString, IsNumber, IsOptional, IsUUID, IsDecimal } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsDecimal()
  price: number;

  @ApiProperty()
  @IsNumber()
  stock: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  imgUrl?: string;

  @ApiProperty()
  @IsString()
  year: string;

  @ApiProperty()
  @IsString()
  brand: string;

  @ApiProperty()
  @IsString()
  model: string;

  @ApiProperty()
  @IsString()
  engine: string;

  @ApiProperty({ description: 'Category ID' })
  @IsUUID()
  categoryId: string;
}
