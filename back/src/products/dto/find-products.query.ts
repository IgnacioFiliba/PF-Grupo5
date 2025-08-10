import { Transform } from 'class-transformer';
import { IsBooleanString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class FindProductsQuery {
  @IsOptional()
  @IsString()
  search?: string; // texto libre

  // ?brands=Bosch,Brembo  o ?brands[]=Bosch&brands[]=Brembo
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? value : String(value).split(',').map((v) => v.trim()),
  )
  brands?: string[];

  @IsOptional()
  @IsBooleanString()
  inStock?: string; // 'true' | 'false'

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  yearMin?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  yearMax?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  priceMin?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  priceMax?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value ?? 1))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value ?? 12))
  @IsInt()
  @Min(1)
  limit?: number;
}