import { IsInt, IsString, Min, Max, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  content: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsUUID()
  productId: string;

  @IsUUID()
  userId: string;
}
