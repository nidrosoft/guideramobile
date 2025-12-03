export enum ExpenseCategory {
  FOOD = 'food',
  TRANSPORT = 'transport',
  ACCOMMODATION = 'accommodation',
  ACTIVITIES = 'activities',
  SHOPPING = 'shopping',
  HEALTH = 'health',
  OTHER = 'other',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  CASH = 'cash',
  DIGITAL_WALLET = 'digital_wallet',
  OTHER = 'other',
}

export interface Expense {
  id: string;
  tripId: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  description: string;
  date: Date;
  paymentMethod: PaymentMethod;
  receipt?: string; // Image URI
  notes?: string;
  createdAt: Date;
}

export interface Budget {
  tripId: string;
  totalBudget: number;
  currency: string;
  categoryBudgets?: {
    [key in ExpenseCategory]?: number;
  };
}

export interface CategoryTotal {
  category: ExpenseCategory;
  amount: number;
  percentage: number;
  color: string;
}

export interface ExpenseStats {
  totalSpent: number;
  budgetRemaining: number;
  percentageUsed: number;
  averagePerDay: number;
  highestExpense: Expense | null;
  categoryTotals: CategoryTotal[];
  dailyTotals: { date: string; amount: number }[];
}

export interface CategoryInfo {
  id: ExpenseCategory;
  name: string;
  icon: string;
  color: string;
  emoji: string;
}
