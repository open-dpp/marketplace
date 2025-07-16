import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { MongooseTestingModule } from '../../../test/mongo.testing.module';
import { APP_GUARD } from '@nestjs/core';
import * as request from 'supertest';
import { PassportTemplateModule } from '../passport-template.module';
import { Connection } from 'mongoose';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { VerifiableCredentialsGuard } from '../../auth/verifiable-credentials/verifiable-credentials.guard';
import { getVcTokenFromConfigService } from '../../../test/auth-token-helper.testing';
import { ConfigService } from '@nestjs/config';
import {
  passportRequestFactory,
  passportTemplatePropsFactory,
} from '../fixtures/passport-template-props.factory';
import { PassportTemplateService } from '../infrastructure/passport-template.service';
import {
  PassportTemplateDoc,
  PassportTemplateDbSchema,
} from '../infrastructure/passport-template.schema';
import { PassportTemplate } from '../domain/passport-template';
import { passportTemplateToDto } from './dto/passport-template.dto';
import { omitBy } from 'lodash';

describe('PassportTemplateController', () => {
  let app: INestApplication;
  let mongoConnection: Connection;
  let module: TestingModule;
  let configService: ConfigService;
  let passportTemplateService: PassportTemplateService;

  const mockNow = new Date('2025-01-01T12:00:00Z');

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockImplementation(() => mockNow.getTime());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        MongooseTestingModule,
        MongooseModule.forFeature([
          {
            name: PassportTemplateDoc.name,
            schema: PassportTemplateDbSchema,
          },
        ]),
        PassportTemplateModule,
      ],
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
    passportTemplateService = module.get(PassportTemplateService);

    await app.init();
  });

  it(`/POST passport template`, async () => {
    const did = randomUUID();
    const passportTemplate = passportRequestFactory.build();
    const vcToken = await getVcTokenFromConfigService(did, configService);
    const response = await request(app.getHttpServer())
      .post(`/templates/passports`)
      .set('Authorization', vcToken)
      .send(passportTemplate);
    expect(response.status).toEqual(201);
    const found = await passportTemplateService.findOneOrFail(response.body.id);

    expect(found).toEqual(
      PassportTemplate.loadFromDb({
        ...passportTemplate,
        vcDid: did,
        isOfficial: false,
        createdAt: mockNow,
        updatedAt: mockNow,
        id: response.body.id,
      }),
    );
  });

  it(`/GET find passport template`, async () => {
    const passportTemplate = PassportTemplate.loadFromDb(
      passportTemplatePropsFactory.build(),
    );
    await passportTemplateService.save(passportTemplate);
    const response = await request(app.getHttpServer()).get(
      `/templates/passports/${passportTemplate.id}`,
    );
    expect(response.status).toEqual(200);
    expect(response.body).toEqual(passportTemplateToDto(passportTemplate));
  });

  it(`/GET find all passport templates`, async () => {
    const passportTemplate = PassportTemplate.loadFromDb(
      passportTemplatePropsFactory.build(),
    );
    const passportTemplate2 = PassportTemplate.loadFromDb(
      passportTemplatePropsFactory.build({ id: randomUUID() }),
    );

    await passportTemplateService.save(passportTemplate);
    await passportTemplateService.save(passportTemplate2);
    const response = await request(app.getHttpServer()).get(
      `/templates/passports`,
    );
    expect(response.status).toEqual(200);
    expect(response.body).toContainEqual(
      omitBy(passportTemplateToDto(passportTemplate), 'templateData'),
    );
    expect(response.body).toContainEqual(
      omitBy(passportTemplateToDto(passportTemplate2), 'templateData'),
    );
  });

  afterAll(async () => {
    await module.close();
    await mongoConnection.destroy();
    await app.close();
  });
});
