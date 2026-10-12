import { z } from 'zod';
import { CATEGORIES, DEPARTMENTS } from './constants';

/** Mirror of WORKFLOW_RULES.md §4. Server is the source of truth; messages must match. */

const departments = DEPARTMENTS as unknown as [string, ...string[]];
const categories = CATEGORIES as unknown as [string, ...string[]];

const amountString = z
  .string({ required_error: 'Amount is required' })
  .trim()
  .min(1, 'Amount is required')
  .refine(
    (v) => /^\d+(\.\d{1,2})?$/.test(v),
    'Amount must be a valid number with up to 2 decimals',
  )
  .refine((v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0;
  }, 'Amount must be greater than zero')
  .refine(
    (v) => Number(v) <= 99999999.99,
    'Amount must not exceed 99,999,999.99',
  );

function isValidISODate(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

function isNotFuture(v: string): boolean {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return v <= `${yyyy}-${mm}-${dd}`;
}

export const voucherFormSchema = z.object({
  departmentName: z
    .string({ required_error: 'Department is required' })
    .trim()
    .min(1, 'Department is required')
    .refine((v) => (departments as string[]).includes(v), {
      message: 'Department is required',
    }),
  expenseTitle: z
    .string({ required_error: 'Expense title is required' })
    .trim()
    .min(1, 'Expense title is required')
    .min(3, 'Expense title must be at least 3 characters')
    .max(150, 'Expense title must be at most 150 characters'),
  expenseDate: z
    .string({ required_error: 'Expense date is required' })
    .trim()
    .min(1, 'Expense date is required')
    .refine(isValidISODate, 'Expense date is required')
    .refine(isNotFuture, 'Expense date cannot be in the future'),
  expenseCategory: z.string().trim().max(60).optional().default('Miscellaneous'),
  expenseDescription: z
    .string()
    .trim()
    .max(2000, 'Description must be at most 2000 characters')
    .optional()
    .or(z.literal('')),
  amount: amountString,
  employeeCode: z
    .string()
    .trim()
    .max(50, 'Employee ID must be at most 50 characters')
    .refine((v) => v === '' || /^[A-Za-z0-9/_-]+$/.test(v), {
      message: 'Employee ID may contain only letters, numbers, / - _',
    })
    .optional()
    .or(z.literal('')),
});

export type VoucherFormValues = z.infer<typeof voucherFormSchema>;

export const categorySchema = z
  .string()
  .refine((v) => !v || (categories as string[]).includes(v), {
    message: 'Invalid expense category',
  });

export const rejectSchema = z.object({
  reason: z
    .string({ required_error: 'Rejection reason is required' })
    .trim()
    .min(1, 'Rejection reason is required')
    .min(5, 'Rejection reason must be at least 5 characters')
    .max(1000, 'Rejection reason must be at most 1000 characters'),
});

export type RejectFormValues = z.infer<typeof rejectSchema>;

export const approveSchema = z.object({
  useSavedSignature: z.boolean().default(false),
  remarks: z
    .string()
    .trim()
    .max(1000, 'Remarks must be at most 1000 characters')
    .optional()
    .or(z.literal('')),
});

export type ApproveFormValues = z.infer<typeof approveSchema>;

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
