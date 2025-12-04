import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheService } from './cache.service.js';
import { CacheController } from './cache.controller.js';

@Module({
  imports: [CacheModule.register()],
  controllers: [CacheController],
  providers: [CacheService],
  exports: [CacheService],
})
export class MyCacheModule {}
