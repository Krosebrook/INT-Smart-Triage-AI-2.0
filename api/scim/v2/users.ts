import { setSecurityHeaders, createRateLimiter } from '../../../src/utils/security.js';
import { parseScimFilter, scimCreateUserSchema, scimPatchSchema } from '../../../src/utils/scim.js';
import { ScimUserService } from '../../../src/services/scimUserService.js';

const rateLimiter = createRateLimiter(60000, 60);

let scimService: ScimUserService | null = null;

function getService(): ScimUserService {
  if (!scimService) {
    scimService = new ScimUserService();
  }
  return scimService;
}

function authenticate(req: any, res: any): boolean {
  const header = req.headers['authorization'] || req.headers['Authorization'];
  const expected = process.env.SCIM_BEARER_TOKEN;

  if (!expected) {
    res.status(500).json({
      error: 'configuration_error',
      message: 'SCIM bearer token is not configured',
    });
    return false;
  }

  if (!header || typeof header !== 'string' || !header.startsWith('Bearer ')) {
    res.status(401).setHeader('WWW-Authenticate', 'Bearer realm="SCIM"');
    res.json({ error: 'unauthorized', message: 'Bearer token required' });
    return false;
  }

  const token = header.slice('Bearer '.length);
  if (token !== expected) {
    res.status(403).json({ error: 'forbidden', message: 'Invalid SCIM bearer token' });
    return false;
  }

  return true;
}

function parseJsonBody(req: any) {
  if (!req.body) {
    return {};
  }

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      return {};
    }
  }

  return req.body;
}

function setScimResponseHeaders(res: any) {
  res.setHeader('Content-Type', 'application/scim+json');
  res.setHeader('Cache-Control', 'no-store');
}

export default async function handler(req: any, res: any) {
  setSecurityHeaders(res);
  setScimResponseHeaders(res);

  if (!rateLimiter(req, res)) {
    return;
  }

  if (!authenticate(req, res)) {
    return;
  }

  const service = getService();
  const resourceId = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id;

  try {
    if (req.method === 'GET') {
      if (resourceId) {
        const user = await service.getUserById(resourceId);
        if (!user) {
          res.status(404).json({ error: 'not_found', message: 'User not found' });
          return;
        }

        res.status(200).json(user);
        return;
      }

      const filterValue = Array.isArray(req.query?.filter) ? req.query.filter[0] : req.query?.filter;
      const region = Array.isArray(req.query?.region) ? req.query.region[0] : req.query?.region;
      const startIndex = parseInt(Array.isArray(req.query?.startIndex) ? req.query.startIndex[0] : req.query?.startIndex || '1', 10);
      const count = parseInt(Array.isArray(req.query?.count) ? req.query.count[0] : req.query?.count || '100', 10);

      const filter = filterValue ? parseScimFilter(filterValue) : null;
      const result = await service.listUsers({ filter, startIndex, count, region });

      res.status(200).json({
        schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
        totalResults: result.totalResults,
        startIndex,
        itemsPerPage: count,
        Resources: result.resources,
      });
      return;
    }

    if (req.method === 'POST') {
      const payload = scimCreateUserSchema.parse(parseJsonBody(req));
      const created = await service.createUser(payload);
      console.info(
        JSON.stringify({
          event: 'scim.user.created',
          userId: created.id,
          region: created.dataResidencyRegion,
          timestamp: new Date().toISOString(),
        })
      );
      res.status(201);
      res.setHeader('Location', created.meta.location);
      res.json(created);
      return;
    }

    if (req.method === 'PUT') {
      if (!resourceId) {
        res.status(400).json({ error: 'invalid_request', message: 'User id is required for PUT' });
        return;
      }
      const payload = scimCreateUserSchema.parse(parseJsonBody(req));
      const updated = await service.replaceUser(resourceId, payload);
      console.info(
        JSON.stringify({
          event: 'scim.user.replaced',
          userId: updated.id,
          region: updated.dataResidencyRegion,
          timestamp: new Date().toISOString(),
        })
      );
      res.status(200).json(updated);
      return;
    }

    if (req.method === 'PATCH') {
      if (!resourceId) {
        res.status(400).json({ error: 'invalid_request', message: 'User id is required for PATCH' });
        return;
      }

      const payload = scimPatchSchema.parse(parseJsonBody(req));
      const patched = await service.patchUser(resourceId, payload.Operations);

      if (!patched) {
        res.status(404).json({ error: 'not_found', message: 'User not found' });
        return;
      }

      console.info(
        JSON.stringify({
          event: 'scim.user.patched',
          userId: patched.id,
          region: patched.dataResidencyRegion,
          timestamp: new Date().toISOString(),
        })
      );
      res.status(200).json(patched);
      return;
    }

    if (req.method === 'DELETE') {
      if (!resourceId) {
        res.status(400).json({ error: 'invalid_request', message: 'User id is required for DELETE' });
        return;
      }

      const user = await service.getUserById(resourceId);
      if (!user) {
        res.status(404).json({ error: 'not_found', message: 'User not found' });
        return;
      }

      await service.deactivateUser(resourceId);
      console.info(
        JSON.stringify({
          event: 'scim.user.deactivated',
          userId: resourceId,
          timestamp: new Date().toISOString(),
        })
      );
      res.status(204).send('');
      return;
    }

    res.status(405).json({ error: 'method_not_allowed', message: 'Unsupported method' });
  } catch (error: any) {
    console.error('SCIM endpoint error', {
      method: req.method,
      message: error?.message,
    });

    if (error?.name === 'ZodError') {
      res.status(400).json({ error: 'invalid_payload', message: error.message, issues: error.issues });
      return;
    }

    res.status(500).json({
      error: 'internal_error',
      message: 'Unable to process SCIM request',
    });
  }
}

