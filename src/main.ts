import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as config from 'config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { SocketIoAdapter } from './adapters/socketIo.adapters';

const serverConfig: any = config.get('server');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useWebSocketAdapter(new SocketIoAdapter(app));
  // app.useStaticAssets(join(__dirname, '..', 'public'));
  // app.setBaseViewsDir(join(__dirname, '..', 'views'));
  // app.setViewEngine('ejs')

  await app.listen(serverConfig.port);
}
bootstrap();

// app.enableCors();
//   app.useStaticAssets(join(__dirname, '..', 'static'));
