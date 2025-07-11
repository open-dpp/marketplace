import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { KeycloakAuthGuard } from './auth/keycloak-auth/keycloak-auth.guard';
import { generateMongoConfig } from './database/config';
import { MongooseModule } from '@nestjs/mongoose';
import {HttpModule} from "@nestjs/axios";
import {AuthModule} from "./auth/auth.module";
import {PermissionsModule} from "./permissions/permissions.module";

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
    PermissionsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: KeycloakAuthGuard,
    },
    // KeycloakPermissionsGuard is now provided by PermissionsModule
  ],
})
export class AppModule {}
