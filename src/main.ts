import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('HTTP');

  app.use((req: Request, res: Response, next: NextFunction) => {
    const { method, originalUrl } = req;
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      const { statusCode } = res;
      logger.log(`${method} ${originalUrl} ${statusCode} +${ms}ms`);
    });
    next();
  });

  //Enable CORS
  app.enableCors({
    origin: '*',
  });

  //Enable Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  //Swagger Setup
  const config = new DocumentBuilder()
    .setTitle('Edura API')
    .setDescription('API documentation for Edura app')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
