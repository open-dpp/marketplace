import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'reflect-metadata';
import {
  NotFoundExceptionFilter,
  NotFoundInDatabaseExceptionFilter,
  ValueErrorFilter,
} from './exceptions/exception.handler';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(
    new NotFoundInDatabaseExceptionFilter(),
    new NotFoundExceptionFilter(),
    new ValueErrorFilter(),
  );
  app.enableCors({
    origin: '*',
  });

  await app.listen(3000, '0.0.0.0');
}

if (require.main === module) {
  bootstrap();
}
