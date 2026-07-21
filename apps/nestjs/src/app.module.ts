import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/database/database.module.js';
import { MyCacheModule } from './modules/cache/cache.module.js';
import { AllWatchersModule } from './modules/all-watchers/all-watchers.module.js';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot(),
    MyCacheModule,
    AllWatchersModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
