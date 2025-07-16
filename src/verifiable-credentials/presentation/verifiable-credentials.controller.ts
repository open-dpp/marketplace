// challenge.controller.ts
import { Body, Controller, ForbiddenException, Post } from '@nestjs/common';
import { ChallengeService } from '../infrastructure/challenge-service';
import { Public } from '../../auth/public/public.decorator';
import { Challenge } from '../domain/challenge';
import { verifyJWT } from 'did-jwt';
import {
  challengeToDto,
  ChallengeVerifySchema,
} from './dto/verifiable-credentials';
import { ConfigService } from '@nestjs/config';
import { createResolver, issueVc } from '../../auth/utils';

@Controller('verifiable-credentials')
export class ChallengeController {
  private readonly issuerDid: string;
  private readonly privateKey: string;
  constructor(
    private readonly challengeService: ChallengeService,
    private readonly configService: ConfigService,
  ) {
    this.issuerDid = this.configService.get('ISSUER_DID');
    this.privateKey = this.configService.get('ISSUER_PRIVATE_KEY_HEX');
  }

  @Public()
  @Post('challenge')
  async requestChallenge(@Body() body: { did: string }) {
    const challenge = Challenge.create({ id: body.did });
    return challengeToDto(await this.challengeService.save(challenge));
  }

  @Public()
  @Post('issue')
  async verify(
    @Body() body: { did: string; challenge: string; signatureJwt: string },
  ) {
    const { did, challenge, signatureJwt } = ChallengeVerifySchema.parse(body);
    const { challenge: expectedChallenge } =
      await this.challengeService.findOneOrFail(did);
    if (!expectedChallenge || expectedChallenge !== challenge) {
      throw new ForbiddenException('Invalid or expired challenge');
    }

    const verified = await verifyJWT(signatureJwt, {
      resolver: createResolver(),
      audience: did,
    });
    const { vc } = verified.payload;
    if (vc.credentialSubject.challenge !== challenge) {
      throw new ForbiddenException('Challenge mismatch in payload');
    }

    await this.challengeService.delete(did);
    const jwt = await issueVc(did, this.privateKey, this.issuerDid);
    return { jwt };
  }
}
