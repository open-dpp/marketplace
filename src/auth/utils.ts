import { DIDResolutionResult, DIDResolver, Resolver } from 'did-resolver';
import bs58 from 'bs58';
import {
  createVerifiableCredentialJwt,
  Issuer,
  verifyCredential,
} from 'did-jwt-vc';
import { UnauthorizedException } from '@nestjs/common';
import { EdDSASigner } from 'did-jwt';

function keyDidResolver(): DIDResolver {
  return async (didUrl: string): Promise<DIDResolutionResult> => {
    try {
      if (!didUrl.startsWith('did:key:')) {
        return {
          didResolutionMetadata: { error: 'invalidDid' },
          didDocument: null,
          didDocumentMetadata: {},
        };
      }

      const multibaseKey = didUrl.substring(8);
      const pubKeyBytes = bs58.decode(multibaseKey.substring(1));

      // Create the DID Document
      const didDocument = {
        '@context': [
          'https://www.w3.org/ns/did/v1',
          'https://w3id.org/security/suites/ed25519-2018/v1',
        ],
        id: didUrl,
        verificationMethod: [
          {
            id: `${didUrl}#${multibaseKey}`,
            type: 'Ed25519VerificationKey2018',
            controller: didUrl,
            publicKeyBase58: bs58.encode(pubKeyBytes.slice(2)),
          },
        ],
        authentication: [`${didUrl}#${multibaseKey}`],
        assertionMethod: [`${didUrl}#${multibaseKey}`],
        capabilityInvocation: [`${didUrl}#${multibaseKey}`],
        capabilityDelegation: [`${didUrl}#${multibaseKey}`],
      };

      return {
        didResolutionMetadata: { contentType: 'application/did+json' },
        didDocument,
        didDocumentMetadata: {},
      };
    } catch {
      return {
        didResolutionMetadata: { error: 'invalidDid' },
        didDocument: null,
        didDocumentMetadata: {},
      };
    }
  };
}

export function createResolver() {
  return new Resolver({
    key: keyDidResolver(),
  });
}
export async function verifyOrFail(vcJwt: string) {
  try {
    const resolver = createResolver();
    return await verifyCredential(vcJwt, resolver);
  } catch {
    throw new UnauthorizedException(
      'Authorization: Invalid verifiable credential.',
    );
  }
}

function hexToEd25519PrivateKey(privateKeyHex: string): Uint8Array {
  // Convert hex string back to Uint8Array
  const fullPrivateKey = Uint8Array.from(Buffer.from(privateKeyHex, 'hex'));
  // For Ed25519, the private key is the first 32 bytes
  // The full keypair from nacl.sign includes both private and public key (64 bytes)
  return fullPrivateKey.slice(0, 32);
}

export async function issueVc(
  did: string,
  privateKey: string,
  issuerDid: string,
): Promise<string> {
  const privateKeyBytes = hexToEd25519PrivateKey(privateKey);

  const vcPayload = {
    sub: did,
    nbf: Math.floor(Date.now() / 1000),
    vc: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential'],
      credentialSubject: {
        id: did,
      },
    },
  };
  const issuer: Issuer = {
    did: issuerDid,
    signer: EdDSASigner(privateKeyBytes),
    alg: 'EdDSA',
  };

  return await createVerifiableCredentialJwt(vcPayload, issuer);
}
