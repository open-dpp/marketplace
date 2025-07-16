import { z } from 'zod';
import { Challenge } from '../../domain/challenge';

export const ChallengeRequestSchema = z.object({
  did: z.string(),
});

export const ChallengeVerifySchema = z.object({
  did: z.string(),
  challenge: z.string(),
  signatureJwt: z.string(),
});

export const ChallengeResponseSchema = z.object({
  did: z.string(),
  challenge: z.string(),
});

export function challengeToDto(challenge: Challenge) {
  return ChallengeResponseSchema.parse({
    did: challenge.id,
    challenge: challenge.challenge,
  });
}
