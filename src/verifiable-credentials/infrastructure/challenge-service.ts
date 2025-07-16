import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChallengeDoc } from './challenge.schema';
import { Challenge } from '../domain/challenge';
import { NotFoundInDatabaseException } from '../../exceptions/service.exceptions';

@Injectable()
export class ChallengeService {
  constructor(
    @InjectModel(ChallengeDoc.name)
    private challengeDoc: Model<ChallengeDoc>,
  ) {}

  convertToDomain(challengeDoc: ChallengeDoc): Challenge {
    return Challenge.loadFromDb({
      id: challengeDoc._id,
      challenge: challengeDoc.challenge,
    });
  }

  async findOneOrFail(id: string) {
    const challengeDocument = await this.challengeDoc.findById(id);
    if (!challengeDocument) {
      throw new NotFoundInDatabaseException(Challenge.name);
    }
    return challengeDocument;
  }

  async saveChallenge(challenge: Challenge) {
    const challengeDoc = await this.challengeDoc.findOneAndUpdate(
      { _id: challenge.id },
      {
        challenge: challenge.challenge,
      },
      {
        new: true, // Return the updated document
        upsert: true, // Create a new document if none found
        runValidators: true,
      },
    );
    return this.convertToDomain(challengeDoc);
  }

  async delete(id: string) {
    await this.challengeDoc.findByIdAndDelete(id);
  }
}
