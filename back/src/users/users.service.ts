import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
  ) {}

  async findAll(page = 1, limit = 3) {
    if (page < 1 || limit < 1) {
      throw new BadRequestException('Page and limit must be positive numbers');
    }

    const [users, total] = await this.usersRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      total,
      page,
      limit,
      data: users,
    };
  }

  async findById(id: string) {
    if (!id) throw new BadRequestException('ID is required');

    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { orders: true },
    });

    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  async update(id: string, user: Partial<Users>) {
    if (!id) throw new BadRequestException('ID is required');

    const foundUser = await this.usersRepository.findOneBy({ id });
    if (!foundUser) throw new NotFoundException('User not found');

    const updatedUser = Object.assign(foundUser, user);
    return this.usersRepository.save(updatedUser);
  }

  async delete(id: string) {
    if (!id) throw new BadRequestException('ID is required');

    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }

    return { message: 'User deleted successfully' };
  }
}
