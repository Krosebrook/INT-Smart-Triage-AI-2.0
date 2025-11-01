# Integration Framework Guide

This guide documents the Smart Triage integration framework and the steps required to connect Zendesk Support. The framework is designed to provide strong validation, secure secret handling, and clear extension points for future integrations.

## Framework Overview

The integration framework lives in `src/integrations/` and is composed of the following modules:

- `errors.js` &mdash; Shared integration error hierarchy.
- `registry.js` &mdash; Registration, configuration validation, and secret resolution utilities.
- `index.js` &mdash; Exposes the registry singleton and re-exports helpers.
- `zendesk/` &mdash; Zendesk-specific configuration schema and OAuth state helpers.

Each integration registers itself with the registry. Definitions include:

- Metadata (key, display name, description, category).
- Authentication configuration (type, scopes, grant type).
- Configuration schema (validated with Zod).
- Secret descriptors for runtime resolution from the environment.
- Optional webhook-specific secrets and environment resolver functions.

## Zendesk Integration

### Required Environment Variables

Add the following variables to your deployment environment (e.g., `.env.local`, Vercel project settings, or CI secrets):

| Variable | Description |
| --- | --- |
| `ZENDESK_SUBDOMAIN` | Zendesk subdomain (e.g., `int-support`). |
| `ZENDESK_OAUTH_REDIRECT_URI` | Absolute URI pointing to the OAuth handler (e.g., `https://app.example.com/api/integrations/zendesk/oauth`). |
| `ZENDESK_ALLOWED_REDIRECT_HOSTS` | Comma-separated list of frontend hosts that may initiate OAuth (e.g., `app.example.com`). |
| `ZENDESK_DEFAULT_LOCALE` | Optional locale hint when building outbound requests. |
| `ZENDESK_OAUTH_CLIENT_ID` | Zendesk OAuth client identifier. |
| `ZENDESK_OAUTH_CLIENT_SECRET` | Zendesk OAuth client secret. |
| `ZENDESK_OAUTH_STATE_SECRET` | Random 32+ character secret used to sign OAuth state payloads. |
| `ZENDESK_WEBHOOK_SECRET` | Shared secret configured on the Zendesk webhook for signature validation. |

> **Security**: Never commit actual secret values. Store them in your secret manager and reference them via environment variables only.

### OAuth Flow (`/api/integrations/zendesk/oauth`)

1. Issue a `GET` request with a `redirect` query parameter pointing to the frontend URL that should receive the integration success response.
2. The handler validates the redirect host, signs an OAuth state payload, and returns a JSON response with an `authorizationUrl`. Redirect the user-agent to this URL to start Zendesk's OAuth flow.
3. Zendesk redirects back to the same handler with `code` and `state` parameters. The handler verifies the state signature, exchanges the code for access and refresh tokens, and responds with:
   - `success`: `true` when the exchange succeeds.
   - `redirect`: The original redirect URL provided in step 1.
   - `tokens`: Sanitized token payload (`accessToken`, optional `refreshToken`, `tokenType`, `scope`, `expiresIn`).

Store the tokens securely in your persistence layer or secret manager before redirecting the user.

### Webhook Handler (`/api/webhooks/zendesk`)

1. Configure the Zendesk webhook to send JSON payloads to this endpoint.
2. Zendesk signs each request with the shared secret. The handler verifies the `X-Zendesk-Webhook-Signature` header with a timing-safe comparison.
3. The JSON payload is validated using a strict Zod schema. Invalid or unauthenticated requests are rejected with detailed error responses.
4. Valid events return `202 Accepted` with a minimal acknowledgment containing the event type. Extend the handler to enqueue background processing or trigger business logic as needed.

## Local Development & Testing

Install dependencies (adds TypeScript and Zod):

```bash
npm install
```

Run the test suite, which now includes integration registry and OAuth state coverage:

```bash
npm test
```

## Extending the Framework

1. Create a new directory under `src/integrations/<provider>/`.
2. Define a configuration schema, environment resolver, and secret descriptors.
3. Register the integration in `src/integrations/index.js`.
4. Implement OAuth, webhook, or other API handlers under `api/` using TypeScript for strong typing.
5. Add documentation to this guide detailing environment requirements and operational considerations.

## Rollback

If you need to roll back the Zendesk integration:

- Remove the integration registration from `src/integrations/index.js`.
- Delete the provider-specific API handlers.
- Remove the Zendesk environment variables from your deployment configuration.
- Re-run `npm test` to confirm the system returns to its previous state.
