import { z } from 'zod';
import { DEPARTMENTS, CATEGORIES, SORT_FIELDS } from '../../config/constants.js';

export const createVoucherSchema = z.object({
  departmentName: z.enum(DEPARTMENTS as unknown as [string, ...string[]], { errorMap: () => ({ message: 'Department is required' }) }),
  expenseTitle: z.string().trim().min(3, 'Expense title is required').max(150),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expense date is required'),
  expenseCategory: z.enum(CATEGORIES as unknown as [string, ...string[]]).default('Miscellaneous'),
  expenseDescription: z.string().max(2000).optional().nullable(),
  amount: z.union([z.number(), z.string()]).refine(
    (v) => {
      const s = String(v);
      if (!/^\d+(\.\d{1,2})?$/.test(s)) return false;
      const n = Number(s);
      return n > 0 && n <= 99999999.99;
    },
    { message: 'Amount must be greater than zero' }
  ),
  employeeCode: z.string().max(50).regex(/^[A-Za-z0-9\-_/]*$/, 'Invalid employee code').optional().nullable(),
})

export const updateVoucherSchema = createVoucherSchema;
export const idParamSchema = z.object({ id: z.string().uuid() }).strict();

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  voucherNumber: z.string().optional(),
  employeeName: z.string().optional(),
  department: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  dateField: z.enum(['expenseDate', 'voucherDate']).default('expenseDate'),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  amountMin: z.coerce.number().optional(),
  amountMax: z.coerce.number().optional(),
  sortBy: z.enum(SORT_FIELDS as unknown as [string, ...string[]]).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}).strict().superRefine((v, ctx) => {
  if (v.dateFrom && v.dateTo && v.dateFrom > v.dateTo) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'dateFrom must be <= dateTo', path: ['dateFrom'] });
  }
  if (v.amountMin !== undefined && v.amountMax !== undefined && v.amountMin > v.amountMax) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'amountMin must be <= amountMax', path: ['amountMin'] });
  }
});

export const rejectSchema = z.object({
  reason: z.string().trim().min(5, 'Rejection reason is required').max(1000),
}).strict();

export type ListQuery = z.infer<typeof listQuerySchema>;
