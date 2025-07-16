import * as crypto from 'crypto';
export class Challenge {
  private constructor(
    public readonly id: string,
    public readonly challenge: string,
  ) {}
  static create(data: { id: string }) {
    return new Challenge(data.id, crypto.randomBytes(16).toString('hex'));
  }
  static loadFromDb(data: { id: string; challenge: string }) {
    return new Challenge(data.id, data.challenge);
  }
}
