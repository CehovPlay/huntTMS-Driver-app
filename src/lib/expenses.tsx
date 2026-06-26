import { createContext, useContext, useState, type ReactNode } from 'react';
import { Banknote, Fuel, ParkingCircle, ReceiptText, Scale, Truck, Wrench } from 'lucide-react-native';

export type ExpenseCategory = 'Fuel' | 'Tolls' | 'Scale' | 'Lumper' | 'Repair' | 'Parking' | 'Other';

export const EXPENSE_META: Record<ExpenseCategory, { icon: typeof Fuel }> = {
  Fuel: { icon: Fuel },
  Tolls: { icon: Banknote },
  Scale: { icon: Scale },
  Lumper: { icon: Truck },
  Repair: { icon: Wrench },
  Parking: { icon: ParkingCircle },
  Other: { icon: ReceiptText },
};

export const EXPENSE_CATEGORIES = Object.keys(EXPENSE_META) as ExpenseCategory[];

export type Expense = {
  id: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  note?: string;
  loadId?: string;
  receiptUri?: string;
};

export const money = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type ExpensesValue = {
  expenses: Expense[];
  total: number;
  add: (e: Omit<Expense, 'id'>) => void;
};

const Ctx = createContext<ExpensesValue | null>(null);

export function ExpensesProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const add = (e: Omit<Expense, 'id'>) =>
    setExpenses((list) => [{ ...e, id: `e${list.length + 1}_${list.length}` }, ...list]);
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  return <Ctx.Provider value={{ expenses, total, add }}>{children}</Ctx.Provider>;
}

export function useExpenses(): ExpensesValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useExpenses must be used within ExpensesProvider');
  return ctx;
}
