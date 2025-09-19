import { Module } from '@nestjs/common';
import { databaseProviders } from './database.providers.js';
import { DatabaseController } from './database.controller.js';
import { PrismaService } from './prisma.service.js';
import { UsersService } from './users.service.js';
import { PrismaController } from './prisma.controller.js';

@Module({
  controllers: [DatabaseController, PrismaController],
  providers: [...databaseProviders, PrismaService, UsersService],
  exports: [...databaseProviders, PrismaService, UsersService],
})
export class DatabaseModule {}
