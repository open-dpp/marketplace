import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC } from '../public/public.decorator';
import { AuthContext } from '../auth-request';
import { verifyOrFail } from '../utils';

@Injectable()
export class VerifiableCredentialsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const isPublic = this.reflector.get<boolean>(
      IS_PUBLIC,
      context.getHandler(),
    );
    if (isPublic) {
      return isPublic;
    }
    const headerAuthorization = request.headers.authorization;

    if (!headerAuthorization) {
      throw new UnauthorizedException('Authorization missing');
    }

    const parts = headerAuthorization.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException(
        'Authorization: Bearer <token> header invalid',
      );
    }
    const vcJwt = parts[1];

    const vcResult = await verifyOrFail(vcJwt);

    const { issuer, credentialSubject } = vcResult.verifiableCredential;
    if (!vcResult.verified) {
      throw new UnauthorizedException(
        'Authorization: Invalid verifiable credential.',
      );
    }
    const issuerDid = this.configService.get('ISSUER_DID');
    if (issuer.id !== issuerDid) {
      throw new UnauthorizedException('Authorization: Invalid issuer.');
    }
    const authContext = new AuthContext();
    authContext.verifiableCredential = { sub: credentialSubject.id };
    request.authContext = authContext;

    return true;
  }
}
