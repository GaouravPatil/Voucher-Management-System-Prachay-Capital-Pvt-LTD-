import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { DEPARTMENTS, CATEGORIES, STATUSES, SORT_FIELDS } from '../../config/constants.js';

const r = Router();
r.get('/options', authenticate, (_req: Request, res: Response) => {
  // Static reference data — safe to cache for an hour.
  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.json({ data: { departments: DEPARTMENTS, categories: CATEGORIES, statuses: STATUSES, sortFields: SORT_FIELDS } });
});
export default r;
