import { handleGenerateResponseTemplate } from '../src/api/public/v1/responseTemplates.js';

export default async function handler(req, res) {
  return handleGenerateResponseTemplate(req, res);
}
