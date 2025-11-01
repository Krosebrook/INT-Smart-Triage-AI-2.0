import { integrationRegistry, normalizeZendeskRedirect } from '../../../src/integrations/index.js';
import {
  createStateToken,
  verifyStateToken
} from '../../../src/integrations/zendesk/state.js';
import {
  IntegrationAuthError,
  IntegrationError
} from '../../../src/integrations/errors.js';
import { setSecurityHeaders, validateHttpMethod } from '../../../src/utils/security.js';

const AUTH_METHOD = ['GET'];
const ZENDESK_KEY = 'zendesk';

type QueryValue = string | string[] | undefined;

type RequestLike = {
  method?: string;
  query?: Record<string, QueryValue>;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  json: (body: unknown) => ResponseLike | void;
  setHeader: (name: string, value: string) => void;
  redirect: (statusOrUrl: number | string, url?: string) => void;
};

function toSingleValue(value: QueryValue): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function handleError(error: unknown, res: ResponseLike) {
  const integrationError =
    error instanceof IntegrationError
      ? error
      : new IntegrationError('Unexpected Zendesk OAuth error', { cause: error });

  if (process.env.NODE_ENV === 'development') {
    console.error('Zendesk OAuth error:', integrationError);
  } else {
    console.error('Zendesk OAuth error:', integrationError.message);
  }

  res.status(integrationError.statusCode ?? 500).json({
    error: integrationError.name,
    message: integrationError.message
  });
}

async function exchangeAuthorizationCode(
  code: string,
  redirectUri: string,
  subdomain: string,
  clientId: string,
  clientSecret: string
) {
  const response = await fetch(`https://${subdomain}.zendesk.com/oauth/tokens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new IntegrationAuthError('Zendesk token exchange failed', {
      details: { status: response.status, body: errorBody }
    });
  }

  const tokenResponse = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    token_type: string;
    scope?: string;
    expires_in?: number;
  };

  return {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token,
    tokenType: tokenResponse.token_type,
    scope: tokenResponse.scope,
    expiresIn: tokenResponse.expires_in
  };
}

export default async function handler(req: RequestLike, res: ResponseLike) {
  setSecurityHeaders(res);

  if (!validateHttpMethod(req, res, AUTH_METHOD)) {
    return;
  }

  try {
    const definition = integrationRegistry.get(ZENDESK_KEY);
    const config = integrationRegistry.resolveEnvironment(ZENDESK_KEY);
    const secrets = integrationRegistry.resolveSecrets(ZENDESK_KEY);

    const scopes = definition.auth?.scopes ?? [];
    const query = req.query ?? {};
    const code = toSingleValue(query.code);
    const stateParam = toSingleValue(query.state);

    if (!code) {
      const redirect = toSingleValue(query.redirect);
      const normalizedRedirect = normalizeZendeskRedirect(
        redirect,
        config.allowedRedirectHosts
      );

      const { token, expiresAt } = createStateToken(
        { redirect: normalizedRedirect },
        secrets.stateSecret
      );

      const authorizeUrl = new URL(
        `https://${config.subdomain}.zendesk.com/oauth/authorizations/new`
      );
      authorizeUrl.searchParams.set('response_type', 'code');
      authorizeUrl.searchParams.set('client_id', secrets.clientId);
      authorizeUrl.searchParams.set('redirect_uri', config.redirectUri);
      authorizeUrl.searchParams.set('scope', scopes.join(' '));
      authorizeUrl.searchParams.set('state', token);

      res.status(200).json({
        success: true,
        authorizationUrl: authorizeUrl.toString(),
        state: token,
        expiresAt
      });
      return;
    }

    if (!stateParam) {
      throw new IntegrationAuthError('Missing OAuth state parameter');
    }

    const state = verifyStateToken(stateParam, secrets.stateSecret) as {
      redirect: string;
    };

    const tokenSet = await exchangeAuthorizationCode(
      code,
      config.redirectUri,
      config.subdomain,
      secrets.clientId,
      secrets.clientSecret
    );

    res.status(200).json({
      success: true,
      redirect: state.redirect,
      tokens: tokenSet
    });
  } catch (error) {
    handleError(error, res);
  }
}
