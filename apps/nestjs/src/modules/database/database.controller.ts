import { Controller, Get } from '@nestjs/common';
import { TestModel } from './models/user.model.js';

@Controller()
export class DatabaseController {
  @Get('/add-user')
  async addUser() {
    await TestModel.create({
      name: 'John Doe',
    });

    return {
      message: 'User added successfully',
    };
  }

  @Get('/users')
  async getUsers() {
    return await TestModel.findAll();
  }
}
