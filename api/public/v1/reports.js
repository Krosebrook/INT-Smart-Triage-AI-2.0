import { handleCreateReport } from '../../../src/api/public/v1/reports.js';

export default async function handler(req, res) {
  return handleCreateReport(req, res);
}
