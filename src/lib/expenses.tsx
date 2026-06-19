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

const SEED: Expense[] = [
  { id: 'e3', category: 'Fuel', amount: 412.5, date: 'Mar 14', note: "Pilot #482 · 96 gal", loadId: '1832888', receiptUri: 'x' },
  { id: 'e2', category: 'Tolls', amount: 18.75, date: 'Mar 14', loadId: '1832888' },
  { id: 'e1', category: 'Scale', amount: 12.0, date: 'Mar 13', note: 'CAT scale', receiptUri: 'x' },
];

type ExpensesValue = {
  expenses: Expense[];
  total: number;
  add: (e: Omit<Expense, 'id'>) => void;
};

const Ctx = createContext<ExpensesValue | null>(null);

export function ExpensesProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>(SEED);
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
