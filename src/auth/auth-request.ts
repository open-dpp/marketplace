import { KeycloakUserInToken } from './keycloak-auth/KeycloakUserInToken';
import { Request } from 'express';
import { ResourcePermission } from '../permissions/resource-permission.interface';

export class AuthContext {
  permissions: Array<ResourcePermission>;
  keycloakUser: KeycloakUserInToken;
}

export interface AuthRequest extends Request {
  authContext: AuthContext;
}
