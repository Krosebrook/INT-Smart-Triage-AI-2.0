import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { SAML } from '@node-saml/node-saml';
import { buildSamlOptions, mapSamlAttributesToProfile, resolveRelayState, VALID_SAML_PROVIDERS } from '../../src/utils/saml.js';
import { setSecurityHeaders, createRateLimiter } from '../../src/utils/security.js';
import { ScimUserService } from '../../src/services/scimUserService.js';

const rateLimiter = createRateLimiter(60000, 30);

let scimService: ScimUserService | null = null;

function getScimService(): ScimUserService {
  if (!scimService) {
    scimService = new ScimUserService();
  }
  return scimService;
}

function parseRequestBody(body: unknown): Record<string, string> {
  if (!body) {
    return {};
  }

  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (jsonError) {
      const formParams = new URLSearchParams(body);
      const parsed: Record<string, string> = {};
      for (const [key, value] of formParams.entries()) {
        parsed[key] = value;
      }
      return parsed;
    }
  }

  return body as Record<string, string>;
}

function ensureSessionSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret) {
    throw new Error('AUTH_SESSION_SECRET is not configured');
  }
  return secret;
}

function buildSessionCookie(token: string): string {
  const maxAge = 3600; // 1 hour
  const parts = [
    `saml_session=${token}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    `Max-Age=${maxAge}`,
  ];
  return parts.join('; ');
}

async function handleMetadata(res: any, samlClient: SAML, samlOptions: Record<string, any>) {
  const metadata = samlClient.generateServiceProviderMetadata(
    samlOptions.decryptionPvk || null,
    samlOptions.publicCert || undefined
  );
  res.setHeader('Content-Type', 'application/xml');
  res.status(200).send(metadata);
}

async function handleLogin(res: any, samlClient: SAML, relayState: string) {
  const redirectUrl = await samlClient.getAuthorizeUrlAsync(relayState, undefined, {});
  res.status(302);
  res.setHeader('Location', redirectUrl);
  res.end();
}

async function handleLogout(res: any, samlClient: SAML, nameId: string, sessionIndex?: string) {
  const profile = {
    nameID: nameId,
    nameIDFormat: process.env.SAML_NAMEID_FORMAT || 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    sessionIndex,
  };
  const logoutUrl = await samlClient.getLogoutUrlAsync(profile as any, '', {});
  res.status(302);
  res.setHeader('Location', logoutUrl);
  res.end();
}

async function handleAcs(req: any, res: any, provider: string, samlClient: SAML, samlOptions: Record<string, any>) {
  const parsedBody = parseRequestBody(req.body);

  if (!parsedBody.SAMLResponse) {
    res.status(400).json({
      error: 'invalid_request',
      message: 'Missing SAMLResponse payload',
    });
    return;
  }

  try {
    const validation = await samlClient.validatePostResponseAsync(parsedBody);

    if (!validation.profile) {
      res.status(401).json({
        error: 'unauthorized',
        message: 'SAML assertion missing profile',
      });
      return;
    }

    const samlProfile = mapSamlAttributesToProfile(validation.profile);
    const scimUsers = getScimService();
    const relayStateData = resolveRelayState(parsedBody.RelayState || req.query?.RelayState);

    let provisionedUser = await scimUsers.getUserByUserName(samlProfile.userName);
    if (!provisionedUser) {
      provisionedUser = await scimUsers.getUserByEmail(samlProfile.email);
    }

    if (!provisionedUser) {
      res.status(403).json({
        error: 'user_not_provisioned',
        message: 'User is not provisioned in SCIM directory',
      });
      return;
    }

    if (!provisionedUser.active) {
      res.status(403).json({
        error: 'user_disabled',
        message: 'User account is disabled',
      });
      return;
    }

    const sessionSecret = ensureSessionSecret();
    const issuedAt = Math.floor(Date.now() / 1000);

    const sessionPayload = {
      jti: crypto.randomUUID(),
      sub: provisionedUser.id,
      email: samlProfile.email,
      userName: provisionedUser.userName,
      provider,
      groups: samlProfile.groups,
      region: provisionedUser.dataResidencyRegion,
      iat: issuedAt,
    };

    const token = jwt.sign(sessionPayload, sessionSecret, {
      audience: samlOptions.audience,
      issuer: samlOptions.issuer,
      expiresIn: '1h',
    });

    res.setHeader('Set-Cookie', buildSessionCookie(token));

    console.info(
      JSON.stringify({
        event: 'saml.login.success',
        provider,
        userId: provisionedUser.id,
        region: provisionedUser.dataResidencyRegion,
        groupsCount: Array.isArray(samlProfile.groups) ? samlProfile.groups.length : 0,
        timestamp: new Date().toISOString(),
      })
    );

    res.status(200).json({
      success: true,
      token,
      redirectTo: relayStateData.redirectTo || '/dashboard',
      user: {
        id: provisionedUser.id,
        userName: provisionedUser.userName,
        email: samlProfile.email,
        name: provisionedUser.name,
        groups: samlProfile.groups,
        dataResidencyRegion: provisionedUser.dataResidencyRegion,
      },
    });
  } catch (error: any) {
    console.error('SAML ACS processing error', {
      message: error?.message,
      provider,
    });
    res.status(401).json({
      error: 'saml_validation_failed',
      message: 'Failed to validate SAML assertion',
    });
  }
}

export default async function handler(req: any, res: any) {
  setSecurityHeaders(res);

  if (!rateLimiter(req, res)) {
    return;
  }

  const provider = (req.query?.provider || 'auth0').toString().toLowerCase();

  if (!VALID_SAML_PROVIDERS.includes(provider)) {
    res.status(400).json({
      error: 'invalid_provider',
      message: `Supported providers are: ${VALID_SAML_PROVIDERS.join(', ')}`,
    });
    return;
  }

  let samlOptions: Record<string, any>;
  try {
    samlOptions = buildSamlOptions(provider);
  } catch (error: any) {
    console.error('SAML configuration error', {
      provider,
      message: error?.message,
    });
    res.status(500).json({
      error: 'configuration_error',
      message: 'SAML integration is not configured correctly',
    });
    return;
  }

  const samlClient = new SAML(samlOptions);

  if (req.method === 'GET') {
    const action = (req.query?.action || '').toString().toLowerCase();

    if (req.query?.metadata !== undefined || action === 'metadata') {
      await handleMetadata(res, samlClient, samlOptions);
      return;
    }

    if (action === 'logout') {
      const nameId = req.query?.nameId || req.query?.nameID;
      if (!nameId) {
        res.status(400).json({
          error: 'invalid_request',
          message: 'nameId query parameter is required for logout',
        });
        return;
      }
      await handleLogout(res, samlClient, nameId.toString(), req.query?.sessionIndex?.toString());
      return;
    }

    const relayState = (req.query?.relayState || '').toString();
    await handleLogin(res, samlClient, relayState);
    return;
  }

  if (req.method === 'POST') {
    await handleAcs(req, res, provider, samlClient, samlOptions);
    return;
  }

  res.status(405).json({
    error: 'method_not_allowed',
    message: 'Only GET and POST are supported for SAML endpoints',
  });
}

