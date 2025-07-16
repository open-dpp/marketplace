import { issueVc } from '../src/auth/utils';
import { ConfigService } from '@nestjs/config';
import * as nacl from 'tweetnacl';
import bs58 from 'bs58';
import * as varint from 'varint';

export async function getVcTokenFromConfigService(
  did: string,
  configService: ConfigService,
) {
  const issuerDid = configService.get('ISSUER_DID');
  const privateKey = configService.get('ISSUER_PRIVATE_KEY_HEX');
  return getVcToken(did, issuerDid, privateKey);
}

export async function getVcToken(
  did: string,
  issuerDid: string,
  privateKey: string,
) {
  const jwt = await issueVc(did, privateKey, issuerDid);
  return `Bearer ${jwt}`;
}

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
