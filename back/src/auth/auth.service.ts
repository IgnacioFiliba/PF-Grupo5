import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto, LoginDto } from 'src/users/dto/create-user.dto';
import { Users } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    private readonly jwtService: JwtService,
  ) {}

  async register(user: CreateUserDto): Promise<Users> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...userWithoutPassword } = user;

    const findUser = await this.usersRepository.findOne({
      where: {
        email: user.email,
      },
    });

    if (findUser) {
      throw new BadRequestException('User already registered');
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);

    const createUser = this.usersRepository.create({
      ...userWithoutPassword,
      password: hashedPassword,
    });
    console.log(user.age);
    if (user.age < 18) {
      createUser.isOverAge = false;
    } else {
      createUser.isOverAge = true;
    }

    const newUser = await this.usersRepository.save(createUser);

    return newUser;
  }

  async signIn(credentials: LoginDto) {
    const findUser: Users | null = await this.usersRepository.findOneBy({
      email: credentials.email,
    });

    if (!findUser) throw new BadRequestException('Bad Credentials');

    const matchingPasswords = await bcrypt.compare(
      credentials.password,
      findUser.password,
    );

    if (!matchingPasswords) {
      throw new BadRequestException('Bad Credentials');
    }

    const payload = {
      id: findUser.id,
      email: findUser.email,
      isAdmin: findUser.isAdmin,
    };

    const token = this.jwtService.sign(payload);

    return { access_Token: token };
  }

  async googleLogin(user: any) {
    const existingUser = await this.usersRepository.findOne({
      where: { email: user.email },
    });

    let finalUser = existingUser;

    finalUser = this.usersRepository.create({
      name: user.name,
      email: user.email,
      password: '',
      isOverAge: true,
    });

    await this.usersRepository.save(finalUser);

    const payload = {
      sub: finalUser.id,
      email: finalUser.email,
    };

    return this.jwtService.sign(payload);
  }
}
