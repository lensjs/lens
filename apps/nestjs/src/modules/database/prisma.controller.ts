import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service.js';

@Controller('prisma')
export class PrismaController {
  constructor(private usersService: UsersService) {}
  @Get()
  async createUser() {
    const user = await this.usersService.createUser({
      name: 'John Doe',
      email: 'john.doe@example.com',
    });

    return {
      message: 'User created successfully',
      data: user,
    };
  }
}
