import { handleGenerateKnowledgeBaseArticle } from '../../../../src/api/public/v1/knowledgeBase.js';

export default async function handler(req, res) {
  return handleGenerateKnowledgeBaseArticle(req, res);
}
