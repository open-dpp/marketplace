import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { VerifiableCredentialsGuard } from './auth/verifiable-credentials/verifiable-credentials.guard';
import { generateMongoConfig } from './database/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from './auth/auth.module';
import { PassportTemplateModule } from './passport-templates/passport-template.module';
import { VerifiableCredentialsModule } from './verifiable-credentials/verifiable-credentials.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...generateMongoConfig(configService),
      }),
      inject: [ConfigService],
    }),
    HttpModule,
    AuthModule,
    PassportTemplateModule,
    VerifiableCredentialsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: VerifiableCredentialsGuard,
    },
  ],
})
export class AppModule {}
