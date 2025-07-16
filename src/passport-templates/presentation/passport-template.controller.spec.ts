import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { MongooseTestingModule } from '../../../test/mongo.testing.module';
import { APP_GUARD } from '@nestjs/core';
import * as request from 'supertest';
import { PassportTemplateModule } from '../passport-template.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { VerifiableCredentialsGuard } from '../../auth/verifiable-credentials/verifiable-credentials.guard';
import { getVcTokenFromConfigService } from '../../../test/auth-token-helper.testing';
import { ConfigService } from '@nestjs/config';

describe('PassportTemplateController', () => {
  let app: INestApplication;
  let mongoConnection: Connection;
  let module: TestingModule;
  let configService: ConfigService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule, PassportTemplateModule],
      providers: [
        {
          provide: APP_GUARD,
          useClass: VerifiableCredentialsGuard, // Changed from useValue to useClass
        },
      ],
    }).compile();

    app = module.createNestApplication();
    mongoConnection = module.get(getConnectionToken());
    configService = module.get(ConfigService);

    await app.init();
  });

  it(`/GET passport template`, async () => {
    const did = randomUUID();
    const vcToken = await getVcTokenFromConfigService(did, configService);
    const response = await request(app.getHttpServer())
      .get(`/templates/passports`)
      .set('Authorization', vcToken);
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({ hello: did });
  });

  afterAll(async () => {
    await module.close();
    await mongoConnection.destroy();
    await app.close();
  });
});
