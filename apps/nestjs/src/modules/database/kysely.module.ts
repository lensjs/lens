import { watcherEmitter } from '@lensjs/watchers';
import { Module } from '@nestjs/common';
import { KyselyModule as BaseKyselyModule } from 'nestjs-kysely';

@Module({
  imports: [
    BaseKyselyModule.forRoot({
      log: (event) => {
        watcherEmitter.emit('kyselyQuery', event);
      },
    }),
  ],
})
export class KyselyModule {}
