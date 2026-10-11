import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import * as c from './controller.js';
import { createVoucherSchema, updateVoucherSchema, idParamSchema, listQuerySchema, rejectSchema } from './schema.js';
import { z } from 'zod';

const r = Router();
r.use(authenticate);

r.post('/', authorize('EMPLOYEE'), validate({ body: createVoucherSchema }), c.create);
r.get('/pending', authorize('DIRECTOR'), validate({ query: listQuerySchema }), (req, _res, next) => {
  (req.query as any).status = 'PENDING_APPROVAL';
  (req.query as any).sortBy = (req.query as any).sortBy ?? 'createdAt';
  (req.query as any).sortOrder = (req.query as any).sortOrder ?? 'asc';
  next();
}, c.list);
r.get('/', validate({ query: listQuerySchema }), c.list);
r.get('/:id', validate({ params: idParamSchema }), c.getOne);
r.get('/:id/history', validate({ params: idParamSchema }), c.history);
r.put('/:id', authorize('EMPLOYEE'), validate({ params: idParamSchema, body: updateVoucherSchema }), c.update);
r.put('/:id/employee-signature', authorize('EMPLOYEE'), validate({ params: idParamSchema }), c.employeeSignature);
r.delete('/:id', authorize('EMPLOYEE'), validate({ params: idParamSchema }), c.remove);
r.post('/:id/submit', authorize('EMPLOYEE'), validate({ params: idParamSchema }), c.submit);
r.post('/:id/approve', authorize('DIRECTOR'), validate({ params: idParamSchema }), c.approve);
r.post('/:id/reject', authorize('DIRECTOR'), validate({ params: idParamSchema, body: rejectSchema }), c.reject);
r.get('/:id/signatures/:type', validate({ params: z.object({ id: z.string().uuid(), type: z.string() }).strict() }), c.signatureImage);

export default r;
