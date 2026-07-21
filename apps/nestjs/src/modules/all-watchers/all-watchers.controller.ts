import { Controller, Get } from '@nestjs/common';
import { CacheService } from '../cache/cache.service.js';
import { MailService } from '../mail/mail.service.js';
import { TestModel } from '../database/models/user.model.js';

@Controller()
export class AllWatchersController {
  constructor(
    private readonly cacheService: CacheService,
    private readonly mailService: MailService,
  ) {}

  // Demo: a single request that exercises EVERY Lens watcher — request, query,
  // cache, mail and exception — all correlated to the same request in the UI.
  @Get('/all-watchers')
  async allWatchers() {
    // Query watcher
    await TestModel.create({ name: 'Lens Demo' });
    const users = await TestModel.findAll();

    // Cache watcher
    await this.cacheService.set('demo:all-watchers', { users: users.length });
    await this.cacheService.get('demo:all-watchers');

    // Mail watcher
    await this.mailService.send({
      from: '"Lens Demo" <demo@lensjs.dev>',
      to: 'inbox@example.com',
      subject: 'All watchers demo',
      text: `This request touched every Lens watcher. Users so far: ${users.length}.`,
    });

    // Exception watcher — intentional; recorded and correlated to this request.
    throw new Error('Intentional demo exception from /all-watchers');
  }
}
