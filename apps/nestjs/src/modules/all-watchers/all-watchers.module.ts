import { Module } from '@nestjs/common';
import { AllWatchersController } from './all-watchers.controller.js';
import { MyCacheModule } from '../cache/cache.module.js';
import { MailModule } from '../mail/mail.module.js';

@Module({
  imports: [MyCacheModule, MailModule],
  controllers: [AllWatchersController],
})
export class AllWatchersModule {}
