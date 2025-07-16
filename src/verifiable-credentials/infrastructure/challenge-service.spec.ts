import { Test, TestingModule } from '@nestjs/testing';
import { Connection } from 'mongoose';
import { MongooseTestingModule } from '../../../test/mongo.testing.module';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { ChallengeService } from './challenge-service';
import { ChallengeDoc, ChallengeSchema } from './challenge.schema';
import { Challenge } from '../domain/challenge';
import { randomUUID } from 'crypto';
import { NotFoundInDatabaseException } from '../../exceptions/service.exceptions';

describe('ChallengeService', () => {
  let service: ChallengeService;
  let mongoConnection: Connection;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        MongooseTestingModule,
        MongooseModule.forFeature([
          {
            name: ChallengeDoc.name,
            schema: ChallengeSchema,
          },
        ]),
      ],
      providers: [ChallengeService],
    }).compile();
    service = module.get<ChallengeService>(ChallengeService);
    mongoConnection = module.get<Connection>(getConnectionToken());
  });

  it('fails if requested challenge could not be found', async () => {
    await expect(service.findOneOrFail(randomUUID())).rejects.toThrow(
      new NotFoundInDatabaseException(Challenge.name),
    );
  });

  it('should save challenge', async () => {
    const challenge = Challenge.create({ id: 'id' });

    const { id } = await service.save(challenge);
    const found = await service.findOneOrFail(id);
    expect(found).toEqual(challenge);
  });

  afterAll(async () => {
    await mongoConnection.close();
    await module.close();
  });
});
