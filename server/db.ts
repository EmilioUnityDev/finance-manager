import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  categories, 
  transactions, 
  userPreferences,
  InsertCategory,
  InsertTransaction,
  InsertUserPreference,
  Category,
  Transaction
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ Categories ============

export async function createCategory(category: InsertCategory): Promise<Category> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(categories).values(category);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(categories).where(eq(categories.id, insertedId)).limit(1);
  return inserted[0]!;
}

export async function getUserCategories(userId: number): Promise<Category[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(categories).where(eq(categories.userId, userId)).orderBy(categories.name);
}

export async function updateCategory(id: number, userId: number, data: Partial<InsertCategory>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(categories)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(categories.id, id), eq(categories.userId, userId)));
}

export async function deleteCategory(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)));
}

// ============ Transactions ============

export async function createTransaction(transaction: InsertTransaction): Promise<Transaction> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(transactions).values(transaction);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(transactions).where(eq(transactions.id, insertedId)).limit(1);
  return inserted[0]!;
}

export async function getUserTransactions(
  userId: number, 
  options?: {
    categoryId?: number;
    type?: "income" | "expense";
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }
): Promise<Transaction[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(transactions.userId, userId)];
  
  if (options?.categoryId) {
    conditions.push(eq(transactions.categoryId, options.categoryId));
  }
  if (options?.type) {
    conditions.push(eq(transactions.type, options.type));
  }
  if (options?.startDate) {
    conditions.push(gte(transactions.transactionDate, options.startDate));
  }
  if (options?.endDate) {
    conditions.push(lte(transactions.transactionDate, options.endDate));
  }

  let query = db.select()
    .from(transactions)
    .where(and(...conditions))
    .orderBy(desc(transactions.transactionDate));

  if (options?.limit) {
    query = query.limit(options.limit) as any;
  }
  if (options?.offset) {
    query = query.offset(options.offset) as any;
  }

  return await query;
}

export async function updateTransaction(id: number, userId: number, data: Partial<InsertTransaction>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(transactions)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
}

export async function deleteTransaction(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
}

export async function getTransactionById(id: number, userId: number): Promise<Transaction | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select()
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .limit(1);

  return result[0];
}

// ============ Statistics ============

export async function getUserFinancialSummary(
  userId: number,
  startDate?: Date,
  endDate?: Date
): Promise<{ totalIncome: number; totalExpense: number; balance: number }> {
  const db = await getDb();
  if (!db) return { totalIncome: 0, totalExpense: 0, balance: 0 };

  const conditions = [eq(transactions.userId, userId)];
  
  if (startDate) {
    conditions.push(gte(transactions.transactionDate, startDate));
  }
  if (endDate) {
    conditions.push(lte(transactions.transactionDate, endDate));
  }

  const result = await db.select({
    type: transactions.type,
    total: sql<number>`SUM(${transactions.amount})`,
  })
  .from(transactions)
  .where(and(...conditions))
  .groupBy(transactions.type);

  const totalIncome = result.find(r => r.type === "income")?.total || 0;
  const totalExpense = result.find(r => r.type === "expense")?.total || 0;

  return {
    totalIncome: Number(totalIncome),
    totalExpense: Number(totalExpense),
    balance: Number(totalIncome) - Number(totalExpense),
  };
}

export async function getCategoryStats(
  userId: number,
  type: "income" | "expense",
  startDate?: Date,
  endDate?: Date
): Promise<Array<{ categoryId: number; categoryName: string; total: number; count: number }>> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [
    eq(transactions.userId, userId),
    eq(transactions.type, type),
  ];
  
  if (startDate) {
    conditions.push(gte(transactions.transactionDate, startDate));
  }
  if (endDate) {
    conditions.push(lte(transactions.transactionDate, endDate));
  }

  const result = await db.select({
    categoryId: transactions.categoryId,
    categoryName: categories.name,
    total: sql<number>`SUM(${transactions.amount})`,
    count: sql<number>`COUNT(*)`,
  })
  .from(transactions)
  .innerJoin(categories, eq(transactions.categoryId, categories.id))
  .where(and(...conditions))
  .groupBy(transactions.categoryId, categories.name);

  return result.map(r => ({
    categoryId: r.categoryId,
    categoryName: r.categoryName,
    total: Number(r.total),
    count: Number(r.count),
  }));
}

// ============ User Preferences ============

export async function getUserPreferences(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  return result[0] || null;
}

export async function upsertUserPreferences(userId: number, prefs: Partial<InsertUserPreference>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(userPreferences)
    .values({ userId, ...prefs })
    .onDuplicateKeyUpdate({
      set: { ...prefs, updatedAt: new Date() },
    });
}
