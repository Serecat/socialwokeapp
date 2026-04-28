import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const config = app.get(ConfigService);
  const corsOrigin = config.get<string>('CORS_ORIGIN')!;

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  app.enableShutdownHooks();
  await app.listen(config.get<number>('PORT') ?? 3001);
}

void bootstrap();
