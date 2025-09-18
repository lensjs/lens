import { Module } from '@nestjs/common';
import { databaseProviders } from './database.providers.js';
import { DatabaseController } from './database.controller.js';

@Module({
  controllers: [DatabaseController],
  providers: [...databaseProviders],
  exports: [...databaseProviders],
})
export class DatabaseModule {}
