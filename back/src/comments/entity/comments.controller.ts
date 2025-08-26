import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { CommentsService } from '../comments.service';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(@Body() dto: CreateCommentDto) {
    return this.commentsService.create(dto);
  }

  @Get('/product/:id')
  getByProduct(@Param('id') productId: string) {
    return this.commentsService.findByProduct(productId);
  }
}
