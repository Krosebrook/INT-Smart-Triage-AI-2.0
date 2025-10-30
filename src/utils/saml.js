/**
 * SAML configuration utilities for Auth0 and Okta integrations
 */

import { z } from 'zod';

const certificateNormalizer = (value) =>
  value ? value.replace(/\r/g, '').replace(/\n/g, '\n').replace(/-----BEGIN CERTIFICATE-----/g, '-----BEGIN CERTIFICATE-----\n').replace(/-----END CERTIFICATE-----/g, '\n-----END CERTIFICATE-----').trim() : value;

const baseSchema = z.object({
  issuer: z.string().min(1, 'SAML issuer is required'),
  audience: z.string().min(1, 'SAML audience is required'),
  callbackUrl: z.string().url('SAML assertion consumer URL must be a valid URL'),
  identifierFormat: z
    .string()
    .min(1)
    .default('urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'),
  requestSigningKey: z.string().optional(),
  requestSigningCert: z.string().optional(),
  decryptionKey: z.string().optional(),
});

const providerSchema = z.object({
  entryPoint: z.string().url('SAML IdP entry point must be a valid URL'),
  logoutUrl: z.string().url().optional(),
  idpCert: z.string().min(1, 'Identity provider certificate is required'),
  providerName: z.string().min(1),
});

const providerEnvMap = {
  auth0: {
    entryPoint: 'SAML_AUTH0_ENTRYPOINT',
    logoutUrl: 'SAML_AUTH0_LOGOUT_URL',
    idpCert: 'SAML_AUTH0_CERT',
    providerName: 'Auth0',
  },
  okta: {
    entryPoint: 'SAML_OKTA_ENTRYPOINT',
    logoutUrl: 'SAML_OKTA_LOGOUT_URL',
    idpCert: 'SAML_OKTA_CERT',
    providerName: 'Okta',
  },
};

export const VALID_SAML_PROVIDERS = Object.keys(providerEnvMap);

export function normalizeCertificate(cert) {
  if (!cert) return cert;
  const cleaned = cert
    .replace(/\s+/g, '')
    .replace('-----BEGINCERTIFICATE-----', '-----BEGIN CERTIFICATE-----')
    .replace('-----ENDCERTIFICATE-----', '-----END CERTIFICATE-----');
  const lines = cleaned
    .replace('-----BEGIN CERTIFICATE-----', '')
    .replace('-----END CERTIFICATE-----', '')
    .match(/.{1,64}/g);

  if (!lines) {
    return cleaned;
  }

  return `-----BEGIN CERTIFICATE-----\n${lines.join('\n')}\n-----END CERTIFICATE-----`;
}

export function getSamlBaseConfigFromEnv() {
  const parsed = baseSchema.parse({
    issuer: process.env.SAML_ISSUER,
    audience: process.env.SAML_AUDIENCE,
    callbackUrl: process.env.SAML_CALLBACK_URL,
    identifierFormat: process.env.SAML_NAMEID_FORMAT || 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    requestSigningKey: process.env.SAML_REQUEST_SIGNING_KEY,
    requestSigningCert: process.env.SAML_REQUEST_SIGNING_CERT,
    decryptionKey: process.env.SAML_DECRYPTION_KEY,
  });

  return {
    issuer: parsed.issuer,
    audience: parsed.audience,
    callbackUrl: parsed.callbackUrl,
    identifierFormat: parsed.identifierFormat,
    requestSigningKey: parsed.requestSigningKey,
    requestSigningCert: parsed.requestSigningCert,
    decryptionKey: parsed.decryptionKey,
  };
}

export function buildSamlProviderConfig(provider) {
  const key = provider?.toLowerCase();
  if (!key || !providerEnvMap[key]) {
    throw new Error(`Unsupported SAML identity provider: ${provider}`);
  }

  const envConfig = providerEnvMap[key];
  const providerValues = providerSchema.parse({
    entryPoint: process.env[envConfig.entryPoint],
    logoutUrl: process.env[envConfig.logoutUrl] || undefined,
    idpCert: normalizeCertificate(process.env[envConfig.idpCert] || ''),
    providerName: envConfig.providerName,
  });

  const base = getSamlBaseConfigFromEnv();

  return {
    ...base,
    ...providerValues,
  };
}

export function buildSamlOptions(provider) {
  const config = buildSamlProviderConfig(provider);

  const options = {
    issuer: config.issuer,
    callbackUrl: config.callbackUrl,
    entryPoint: config.entryPoint,
    logoutUrl: config.logoutUrl,
    identifierFormat: config.identifierFormat,
    idpCert: config.idpCert,
    audience: config.audience,
    wantAssertionsSigned: true,
    wantAuthnResponseSigned: true,
    acceptedClockSkewMs: 5000,
    disableRequestedAuthnContext: false,
    authnContext: [
      'urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport',
      'urn:oasis:names:tc:SAML:2.0:ac:classes:TLSClient',
    ],
    validateInResponseTo: 'ifPresent',
    requestIdExpirationPeriodMs: 3600000,
    racComparison: 'exact',
  };

  if (config.requestSigningKey) {
    options.privateKey = config.requestSigningKey.replace(/\\n/g, '\n');
    options.signatureAlgorithm = 'sha256';
  }

  if (config.requestSigningCert) {
    options.publicCert = certificateNormalizer(config.requestSigningCert);
  }

  if (config.decryptionKey) {
    options.decryptionPvk = config.decryptionKey.replace(/\\n/g, '\n');
  }

  return options;
}

export function mapSamlAttributesToProfile(profile) {
  if (!profile) {
    throw new Error('SAML profile payload missing');
  }

  const emailAttr =
    profile.email ||
    profile.mail ||
    profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];

  const firstName =
    profile.givenName ||
    profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'];

  const lastName =
    profile.sn ||
    profile.surname ||
    profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'];

  const userName = profile.nameID || profile['uid'] || emailAttr;

  if (!emailAttr || !userName) {
    throw new Error('SAML assertion missing required identifiers');
  }

  return {
    userName,
    email: emailAttr,
    firstName: firstName || '',
    lastName: lastName || '',
    groups: profile['http://schemas.xmlsoap.org/claims/Group'] || profile.groups || [],
    rawAttributes: profile,
  };
}

export function resolveRelayState(relayState) {
  if (!relayState) {
    return {};
  }

  try {
    const decoded = Buffer.from(relayState, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (error) {
    return { redirectTo: relayState };
  }
}

