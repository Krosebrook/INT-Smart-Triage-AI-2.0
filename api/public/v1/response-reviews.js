import { handleReviewResponse } from '../../../src/api/public/v1/responseReviews.js';

export default async function handler(req, res) {
  return handleReviewResponse(req, res);
}
