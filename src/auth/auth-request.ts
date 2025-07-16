import { Request } from 'express';

export interface IVerifiableCredential {
  sub: string;
}

export class AuthContext {
  verifiableCredential: IVerifiableCredential;
}

export interface AuthRequest extends Request {
  authContext: AuthContext;
}
