import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { KeycloakAuthTestingGuard } from '../../../test/keycloak-auth.guard.testing';
import { MongooseTestingModule } from '../../../test/mongo.testing.module';
import { PermissionsModule } from '../../permissions/permissions.module';
import { APP_GUARD } from '@nestjs/core';
import getKeycloakAuthToken from '../../../test/auth-token-helper.testing';
import * as request from 'supertest';
import { PassportTemplateModule } from '../passport-template.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('PassportTemplateController', () => {
  let app: INestApplication;
  const keycloakAuthTestingGuard = new KeycloakAuthTestingGuard(new Map());
  let mongoConnection: Connection;

  const userId = randomUUID();
  const organizationId = randomUUID();
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        MongooseTestingModule,
        PermissionsModule,
        PassportTemplateModule,
      ],
      providers: [
        {
          provide: APP_GUARD,
          useValue: keycloakAuthTestingGuard,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    mongoConnection = module.get(getConnectionToken());

    await app.init();
  });

  it(`/GET passport template`, async () => {
    const response = await request(app.getHttpServer())
      .get(`/organizations/${organizationId}/templates/passports`)
      .set(
        'Authorization',
        getKeycloakAuthToken(
          userId,
          [organizationId],
          keycloakAuthTestingGuard,
        ),
      );
    expect(response.status).toEqual(200);
  });

  it(`/GET passport template fails if user is not a member of organization`, async () => {
    const response = await request(app.getHttpServer())
      .get(`/organizations/${organizationId}/templates/passports`)
      .set(
        'Authorization',
        getKeycloakAuthToken(userId, [randomUUID()], keycloakAuthTestingGuard),
      );
    expect(response.status).toEqual(403);
  });

  afterAll(async () => {
    await module.close();
    await mongoConnection.destroy();
    await app.close();
  });
});
