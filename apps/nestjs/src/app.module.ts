import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/database/database.module.js';

@Module({
  imports: [DatabaseModule, ConfigModule.forRoot()],
  controllers: [AppController],
})
export class AppModule {}
