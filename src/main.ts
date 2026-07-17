import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Trust Proxy
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);
  expressApp.disable('x-powered-by');

  // CORS
  const allowedOrigins = configService.get<string[]>('cors.origins') ?? [];
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY'],
    credentials: true,
  });

  // Middlewares

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // start
  const port = configService.get<number>('port') ?? 7004;
  const nodeEnv = configService.get<string>('nodeEnv');

  await app.listen(port);
  console.log(
    `[nestjs-audit-services] running on port ${port} | mode: ${nodeEnv}`,
  );
  console.log(`Health: http://localhost:${port}`);
}

bootstrap();
