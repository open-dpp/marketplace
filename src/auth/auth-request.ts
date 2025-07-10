import { KeycloakUserInToken } from './keycloak-auth/KeycloakUserInToken';
import { Request } from 'express';
import { ResourcePermission } from '../permissions/resource-permission.interface';

export const AUTH_CONTEXT = 'authContext';

export class AuthContext {
  permissions: Array<ResourcePermission>;
  token: string;
  keycloakUser: KeycloakUserInToken;
}

export interface AuthRequest extends Request {
  authContext: AuthContext;
}
