import { Controller, Get } from '@nestjs/common';
import { CacheService } from './cache.service.js';

@Controller()
export class CacheController {
  constructor(private readonly cacheService: CacheService) {}

  @Get('/get-cache')
  async getValue() {
    const value = await this.cacheService.get('test');
    return { key: 'test', value };
  }

  @Get('/set-cache')
  async setValue() {
    await this.cacheService.set('test', { hello: 'world' });

    return { message: 'Value set' };
  }

  @Get('/has-cache')
  async hasValue() {
    const hasValue = await this.cacheService.has('test');

    return { hasValue };
  }

  @Get('/delete-cache')
  async deleteKey() {
    await this.cacheService.del('test');

    return { message: 'Key deleted' };
  }

  @Get('/clear-cache')
  async clearCache() {
    await this.cacheService.clear();

    return { message: 'Cache cleared' };
  }
}
