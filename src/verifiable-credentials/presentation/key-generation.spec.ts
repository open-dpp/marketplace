import * as varint from 'varint';

import * as nacl from 'tweetnacl';
import bs58 from 'bs58';
import { createVerifiableCredentialJwt, Issuer } from 'did-jwt-vc';
import { EdDSASigner } from 'did-jwt';
export function generateDidKey() {
  const keyPair = nacl.sign.keyPair();

  const publicKey = keyPair.publicKey;
  const privateKey = keyPair.secretKey;

  const prefix = Uint8Array.from(varint.encode(0xed));
  const prefixedKey = new Uint8Array(prefix.length + publicKey.length);
  prefixedKey.set(prefix, 0);
  prefixedKey.set(publicKey, prefix.length);

  const multibaseEncoded = 'z' + bs58.encode(prefixedKey);
  const did = `did:key:${multibaseEncoded}`;

  return {
    did,
    publicKeyHex: Buffer.from(publicKey).toString('hex'),
    privateKeyHex: Buffer.from(privateKey).toString('hex'),
  };
}

function hexToEd25519PrivateKey(privateKeyHex: string): Uint8Array {
  // Convert hex string back to Uint8Array
  const fullPrivateKey = Uint8Array.from(Buffer.from(privateKeyHex, 'hex'));

  // For Ed25519, the private key is the first 32 bytes
  // The full keypair from nacl.sign includes both private and public key (64 bytes)
  return fullPrivateKey.slice(0, 32);
}

async function issueVc(did: string, privateKey: string, challenge: string) {
  const privateKeyBytes = hexToEd25519PrivateKey(privateKey);

  const vcPayload = {
    sub: did,
    nbf: Math.floor(Date.now() / 1000),
    vc: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential'],
      credentialSubject: {
        id: did,
        challenge,
      },
    },
  };
  const issuer: Issuer = {
    did,
    signer: EdDSASigner(privateKeyBytes),
    alg: 'EdDSA',
  };

  return await createVerifiableCredentialJwt(vcPayload, issuer);
}

describe('PassportTemplate', () => {
  it('should generate a did with private key', async () => {
    const { did, privateKeyHex } = generateDidKey();
    console.log('Did: ', did);
    console.log('PrivateHex: ', privateKeyHex);
    const vcJwt = await issueVc(did, privateKeyHex, '1234567890');
    console.log(vcJwt);
  });

  it('should generate jwt with challenge', async () => {
    const vcJwt = await issueVc(
      'did:key:z6MkkNWoXwEGxTbotD353peqD4zYiDuEiUyS9WpJsb64PEwN',
      '1493d80ce4bb57fb13fc36561dfb137f83b5bb45f1b5b3636896d48f1abf9faf57eee76e383c4b340387f6ad6c0f058c38efc6764f08c8005d3cfe714ca86665',
      '33af5596d305a1c33dbd639d6a512263',
    );
    console.log(vcJwt);
  });
});
