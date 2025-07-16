import { Module } from '@nestjs/common';

import { ChallengeController } from './presentation/challange-controller';
import { ChallengeService } from './infrastructure/challenge-service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ChallengeDoc,
  ChallengeSchema,
} from './infrastructure/challenge.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ChallengeDoc.name,
        schema: ChallengeSchema,
      },
    ]),
  ],
  controllers: [ChallengeController],
  providers: [ChallengeService],
  exports: [],
})
export class VerifiableCredentialsModule {}
