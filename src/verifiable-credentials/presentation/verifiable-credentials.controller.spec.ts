import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { MongooseTestingModule } from '../../../test/mongo.testing.module';
import { APP_GUARD } from '@nestjs/core';
import * as request from 'supertest';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { VerifiableCredentialsGuard } from '../../auth/verifiable-credentials/verifiable-credentials.guard';
import { VerifiableCredentialsModule } from '../verifiable-credentials.module';
import * as nacl from 'tweetnacl';
import bs58 from 'bs58';
import * as varint from 'varint';
import { createVerifiableCredentialJwt, Issuer } from 'did-jwt-vc';
import { EdDSASigner } from 'did-jwt';
import { NotFoundInDatabaseExceptionFilter } from '../../exceptions/exception.handler';

describe('PassportTemplateController', () => {
  let app: INestApplication;
  let mongoConnection: Connection;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule, VerifiableCredentialsModule],
      providers: [
        {
          provide: APP_GUARD,
          useClass: VerifiableCredentialsGuard, // Changed from useValue to useClass
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalFilters(new NotFoundInDatabaseExceptionFilter());
    mongoConnection = module.get(getConnectionToken());

    await app.init();
  });

  it(`/POST challenge`, async () => {
    const did = randomUUID();
    const response = await request(app.getHttpServer())
      .post(`/verifiable-credentials/challenge`)
      .send({ did: did });
    expect(response.status).toEqual(201);
    expect(response.body).toEqual({ did, challenge: expect.any(String) });
  });

  function generateDid() {
    const keyPair = nacl.sign.keyPair();

    const publicKey = keyPair.publicKey;
    const privateKey = keyPair.secretKey;

    const prefix = Uint8Array.from(varint.encode(0xed));
    const prefixedKey = new Uint8Array(prefix.length + publicKey.length);
    prefixedKey.set(prefix, 0);
    prefixedKey.set(publicKey, prefix.length);

    const multibaseEncoded = 'z' + bs58.encode(prefixedKey);
    const did = `did:key:${multibaseEncoded}`;

    return {
      did,
      publicKey: publicKey,
      privateKey: privateKey,
    };
  }

  async function createSignedJwt(
    did: string,
    privateKey: Uint8Array<ArrayBuffer>,
    challenge: string,
  ) {
    const vcPayload = {
      sub: did,
      nbf: Math.floor(Date.now() / 1000),
      vc: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        credentialSubject: {
          id: did,
          challenge,
        },
      },
    };
    const issuer: Issuer = {
      did,
      signer: EdDSASigner(privateKey),
      alg: 'EdDSA',
    };

    return await createVerifiableCredentialJwt(vcPayload, issuer);
  }

  async function callCreateChallenge(did) {
    const response = await request(app.getHttpServer())
      .post(`/verifiable-credentials/challenge`)
      .send({ did: did });
    return response.body.challenge;
  }

  async function callIssueVc(
    did: string,
    challenge: string,
    signatureJwt: string,
  ) {
    return await request(app.getHttpServer())
      .post(`/verifiable-credentials/issue`)
      .send({ did: did, challenge: challenge, signatureJwt });
  }

  it(`/POST issue verifiable credential`, async () => {
    const { did, privateKey } = generateDid();
    const challenge = await callCreateChallenge(did);
    const signatureJwt = await createSignedJwt(did, privateKey, challenge);
    const response = await callIssueVc(did, challenge, signatureJwt);
    expect(response.status).toEqual(201);
    expect(response.body).toEqual({ jwt: expect.any(String) });
  });

  it(`/POST issue verifiable credential fails if private key does not fit to public key`, async () => {
    const { did } = generateDid();
    const challenge = await callCreateChallenge(did);
    const { privateKey: otherPrivateKey } = generateDid();
    const signatureJwt = await createSignedJwt(did, otherPrivateKey, challenge);
    const response = await callIssueVc(did, challenge, signatureJwt);
    expect(response.status).toEqual(401);
    expect(response.body.message).toEqual(
      'Authorization: Invalid verifiable credential.',
    );
  });

  it(`/POST issue verifiable credential fails if no challenge exists for did`, async () => {
    const { did } = generateDid();
    const challenge = await callCreateChallenge(did);
    const { did: otherDid, privateKey: otherPrivateKey } = generateDid();
    const signatureJwt = await createSignedJwt(
      otherDid,
      otherPrivateKey,
      challenge,
    );
    const response = await callIssueVc(otherDid, challenge, signatureJwt);
    expect(response.status).toEqual(404);
    expect(response.body.message).toEqual('Challenge could not be found.');
  });

  it(`/POST issue verifiable credential fails if did in payload differs from the one in the token`, async () => {
    const { did } = generateDid();
    const challenge = await callCreateChallenge(did);
    const { did: otherDid, privateKey: otherPrivateKey } = generateDid();
    const signatureJwt = await createSignedJwt(
      otherDid,
      otherPrivateKey,
      challenge,
    );
    const response = await callIssueVc(did, challenge, signatureJwt);
    expect(response.status).toEqual(403);
    expect(response.body.message).toEqual('Invalid issuer');
  });

  it(`/POST issue verifiable credential fails for wrong challenge`, async () => {
    const { did, privateKey } = generateDid();
    const challenge = await callCreateChallenge(did);

    const signatureJwt = await createSignedJwt(
      did,
      privateKey,
      'otherChallenge',
    );
    const response = await callIssueVc(did, challenge, signatureJwt);
    expect(response.status).toEqual(403);
    expect(response.body.message).toEqual('Challenge mismatch in payload');
  });

  it(`/POST issue verifiable credential fails for wrong challenge in token`, async () => {
    const { did, privateKey } = generateDid();
    const challenge = await callCreateChallenge(did);

    const signatureJwt = await createSignedJwt(
      did,
      privateKey,
      'otherChallenge',
    );
    const response = await callIssueVc(did, challenge, signatureJwt);
    expect(response.status).toEqual(403);
    expect(response.body.message).toEqual('Challenge mismatch in payload');
  });

  it(`/POST issue verifiable credential fails if challenge is not in database`, async () => {
    const { did, privateKey } = generateDid();
    const challenge = await callCreateChallenge(did);

    const signatureJwt = await createSignedJwt(did, privateKey, challenge);
    const response = await callIssueVc(
      did,
      'otherChallengeNotDb',
      signatureJwt,
    );
    expect(response.status).toEqual(403);
    expect(response.body.message).toEqual('Invalid or expired challenge');
  });

  afterAll(async () => {
    await module.close();
    await mongoConnection.destroy();
    await app.close();
  });
});
