import { handleCreateTriageReport } from '../../../src/api/public/v1/triageReports.js';

export default async function handler(req, res) {
  return handleCreateTriageReport(req, res);
}
