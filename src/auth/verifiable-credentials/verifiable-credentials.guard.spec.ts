import { Test, TestingModule } from '@nestjs/testing';
import { VerifiableCredentialsGuard } from './verifiable-credentials.guard';
import { ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Connection } from 'mongoose';
import { randomUUID } from 'crypto';
import { MongooseTestingModule } from '../../../test/mongo.testing.module';
import { PassportTemplateModule } from '../../passport-templates/passport-template.module';
import { getConnectionToken } from '@nestjs/mongoose';
import { getVcToken } from '../../../test/auth-token-helper.testing';
import * as request from 'supertest';

describe('VerifiableCredentialGuard', () => {
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

  it(`should throw unauthorized exception when authorization header is missing`, async () => {
    const response = await request(app.getHttpServer()).get(
      `/templates/passports`,
    );
    expect(response.status).toEqual(401);
    expect(response.body.message).toEqual('Authorization missing');
  });

  it('should throw unauthorized exception when authorization format is invalid', async () => {
    const response = await request(app.getHttpServer())
      .get(`/templates/passports`)
      .set('Authorization', 'InvalidFormat');
    expect(response.status).toEqual(401);
    expect(response.body.message).toEqual(
      'Authorization: Bearer <token> header invalid',
    );
  });

  it('should throw unauthorized exception for wrong issuer', async () => {
    const did = randomUUID();
    const vcToken = await getVcToken(
      did,
      'did:key:z6MkrphoYFrX4SpLZYveKQ4SBCTt4pL13sR6rPuhJLMxjEks',
      '618e9391279793c414f2666836fe65173260f1c903bde1f39d5ed40a0935ad25b7ca9080ec7a640d9fba19316ece5cc2ece514bdf81b124204e5986e4a6dc784',
    );
    const response = await request(app.getHttpServer())
      .get(`/templates/passports`)
      .set('Authorization', vcToken);
    expect(response.status).toEqual(401);
    expect(response.body.message).toEqual('Authorization: Invalid issuer.');
  });

  it('should throw unauthorized exception for invalid verifiable credential', async () => {
    const did = randomUUID();
    const vcToken = await getVcToken(
      did,
      'did:key:z6MkrphoYFrX4SpLZYveKQ4SBCTt4pL13sR6rPuhJLMxjEks',
      configService.get('ISSUER_PRIVATE_KEY_HEX'),
    );
    const response = await request(app.getHttpServer())
      .get(`/templates/passports`)
      .set('Authorization', vcToken);
    expect(response.status).toEqual(401);
    expect(response.body.message).toEqual(
      'Authorization: Invalid verifiable credential.',
    );
  });

  afterAll(async () => {
    await module.close();
    await mongoConnection.destroy();
    await app.close();
  });
});
