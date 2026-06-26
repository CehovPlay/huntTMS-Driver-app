import { useCallback } from 'react';

import { apiFetch } from './client';
import { useApiQuery, type ApiQueryResult } from './use-api-query';

export type ExpenseCategoryName =
  | 'FUEL'
  | 'TRUCK_LEASE'
  | 'MAINTENANCE'
  | 'REPAIR'
  | 'TOLL'
  | 'OFFICE'
  | 'INSURANCE'
  | 'PARKING'
  | 'LUMPER'
  | 'PERMIT'
  | 'OTHER';

export type DriverExpenseStatus =
  | 'NEEDS_RECEIPT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | string;

export type DriverExpense = {
  id: number;
  loadId?: number | null;
  category: ExpenseCategoryName;
  amount: number;
  expenseDate?: string | number | null;
  status?: DriverExpenseStatus | null;
  vendor?: string | null;
  notes?: string | null;
  receiptFileId?: number | null;
  receiptUrl?: string | null;
};

export type CreateDriverExpenseInput = {
  category: ExpenseCategoryName;
  amount: number;
  loadId?: number | null;
  notes?: string | null;
};

export const EXPENSE_CATEGORY_OPTIONS: { name: ExpenseCategoryName; label: string }[] = [
  { name: 'FUEL', label: 'Fuel' },
  { name: 'TOLL', label: 'Tolls' },
  { name: 'PARKING', label: 'Parking' },
  { name: 'LUMPER', label: 'Lumper' },
  { name: 'REPAIR', label: 'Repair' },
  { name: 'MAINTENANCE', label: 'Maintenance' },
  { name: 'TRUCK_LEASE', label: 'Truck lease' },
  { name: 'INSURANCE', label: 'Insurance' },
  { name: 'PERMIT', label: 'Permit' },
  { name: 'OFFICE', label: 'Office' },
  { name: 'OTHER', label: 'Other' },
];

export function getDriverExpenses(): Promise<DriverExpense[]> {
  return apiFetch('/api/driver/expenses');
}

export function createDriverExpense(input: CreateDriverExpenseInput): Promise<DriverExpense> {
  return apiFetch('/api/driver/expenses', {
    method: 'POST',
    body: {
      category: input.category,
      amount: input.amount,
      loadId: input.loadId ?? null,
      notes: input.notes ?? null,
    },
  });
}

export function useDriverExpenses(): ApiQueryResult<DriverExpense[]> {
  return useApiQuery(useCallback(() => getDriverExpenses(), []));
}

export function expenseCategoryLabel(category: string): string {
  return EXPENSE_CATEGORY_OPTIONS.find((o) => o.name === category)?.label ?? category.replaceAll('_', ' ');
}

export function money(n: number): string {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}
