import { Controller, Get, HttpException, Res } from '@nestjs/common';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return 'hello-world';
  }

  @Get('/hello-world')
  getHelloWorld() {
    return {
      hello: 'world',
    };
  }

  @Get('/error')
  getThrowsError() {
    throw new HttpException('This is an error', 400);
  }

  @Get('/string')
  getReturnsString() {
    return 'This is a string';
  }

  @Get('/file')
  getFile(@Res() res: any) {
    const filePath = join(__dirname, '..', 'assets', 'example.pdf');

    res.sendFile(filePath);
  }
}
