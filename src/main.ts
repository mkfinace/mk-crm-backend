import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { json } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Required for the Deal Command Bar's real-time sync (RealtimeGateway) —
  // without this, @WebSocketGateway has no transport wired up and every
  // socket.io connection from the frontend silently fails.
  app.useWebSocketAdapter(new IoAdapter(app));

  // Raised from the default ~100kb — hero image/video uploads are sent as
  // base64 data URIs (stored directly in Site Settings, no separate file
  // storage needed), which can be several MB once base64-encoded.
  app.use(json({ limit: '25mb' }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('MK CRM API')
    .setDescription('MK Finance Car Sales + Finance CRM API')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
