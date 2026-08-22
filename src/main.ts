import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(); // allow the Next.js frontend to call this API
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('MK Finance — Car CRM API')
    .setDescription('New Car Website + Dealer + Finance CRM backend')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document); // → /api-docs

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 API running on port ${port}`);
  console.log(`📖 API docs at /api-docs`);
}
bootstrap();
