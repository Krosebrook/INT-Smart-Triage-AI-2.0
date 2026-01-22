import { handleHealthCheck } from '../../../src/api/public/v1/health.js';

export default async function handler(req, res) {
  return handleHealthCheck(req, res);
}
