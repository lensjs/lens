import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { LensModule } from '@lensjs/nestjs';

@Module({
  imports: [
    LensModule.forRoot({
      appName: 'Nest Example',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
