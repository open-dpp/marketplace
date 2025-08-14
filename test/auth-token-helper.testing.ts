import { KeycloakAuthTestingGuard } from './keycloak-auth.guard.testing';
import { randomUUID } from 'crypto';
import { KeycloakUserInToken } from '../src/auth/keycloak-auth/KeycloakUserInToken';

const getKeycloakAuthToken = (
  userId: string,
  organizationIds: string[],
  keycloakAuthTestingGuard: KeycloakAuthTestingGuard,
  userEmail?: string,
) => {
  const organizationsString = `[${organizationIds.map((id) => id).join(',')}]`;
  const token = Buffer.from(organizationsString).toString('base64');
  const name = randomUUID();
  const email = userEmail ?? `${name}@example.com`;
  const keycloakUser: KeycloakUserInToken = {
    sub: userId,
    email,
    name: `Test User ${name}`,
    preferred_username: `Test User ${name}`,
    email_verified: true,
    memberships: [],
  };
  keycloakAuthTestingGuard.tokenToUserMap.set(token, keycloakUser);
  return `Bearer ${token}`;
};

export default getKeycloakAuthToken;
