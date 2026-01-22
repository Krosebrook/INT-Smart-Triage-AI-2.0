import { getDemoResource } from '../src/services/demoDataService.js';
import { setSecurityHeaders, validateHttpMethod } from '../src/utils/security.js';

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function authorizeRequest(req) {
  const demoEnabled = process.env.DEMO_MODE === 'true';
  if (!demoEnabled) {
    return { authorized: false, status: 403, message: 'Demo mode disabled' };
  }

  const expectedKey = process.env.DEMO_PROXY_KEY;
  if (expectedKey) {
    const provided = req.headers['x-demo-auth'];
    if (!provided || provided !== expectedKey) {
      return { authorized: false, status: 401, message: 'Invalid demo credentials' };
    }
  }

  return { authorized: true };
}

export default async function handler(req, res) {
  setSecurityHeaders(res);

  if (!validateHttpMethod(req, res, ['POST'])) {
    return;
  }

  const authorization = authorizeRequest(req);
  if (!authorization.authorized) {
    return res.status(authorization.status).json({ error: authorization.message });
  }

  try {
    const { resource, params } = await parseBody(req);

    if (!resource) {
      return res.status(400).json({ error: 'Resource parameter is required' });
    }

    const data = getDemoResource(resource, params);

    if (!data) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    return res.status(200).json({
      mode: 'demo',
      resource,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const status = error.message === 'Invalid JSON body' ? 400 : 500;
    return res.status(status).json({ error: error.message });
  }
}
