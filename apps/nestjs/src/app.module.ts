import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/database/database.module.js';
import { MyCacheModule } from './modules/cache/cache.module.js';

@Module({
  imports: [DatabaseModule, ConfigModule.forRoot(), MyCacheModule],
  controllers: [AppController],
})
export class AppModule {}
