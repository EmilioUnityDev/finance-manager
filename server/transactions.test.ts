import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("transactions router", () => {
  let testCategoryId: number;
  let testTransactionId: number;

  beforeAll(async () => {
    // Create a test category for transactions
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const category = await caller.categories.create({
      name: "Test Category",
      type: "expense",
      color: "#10b981",
    });
    
    testCategoryId = category.id;
  });

  it("creates a transaction successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const transaction = await caller.transactions.create({
      categoryId: testCategoryId,
      amount: 50.00,
      type: "expense",
      description: "Test expense",
      transactionDate: new Date(),
    });

    expect(transaction).toBeDefined();
    expect(transaction.amount).toBe(5000); // stored in cents
    expect(transaction.type).toBe("expense");
    expect(transaction.categoryId).toBe(testCategoryId);
    
    testTransactionId = transaction.id;
  });

  it("lists user transactions", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const transactions = await caller.transactions.list({});

    expect(Array.isArray(transactions)).toBe(true);
    expect(transactions.length).toBeGreaterThan(0);
  });

  it("gets transaction by id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const transaction = await caller.transactions.getById({ id: testTransactionId });

    expect(transaction).toBeDefined();
    expect(transaction?.id).toBe(testTransactionId);
  });

  it("updates a transaction", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.transactions.update({
      id: testTransactionId,
      amount: 75.50,
      description: "Updated expense",
    });

    expect(result.success).toBe(true);

    const updated = await caller.transactions.getById({ id: testTransactionId });
    expect(updated?.amount).toBe(7550); // 75.50 in cents
    expect(updated?.description).toBe("Updated expense");
  });

  it("deletes a transaction", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.transactions.delete({ id: testTransactionId });
    expect(result.success).toBe(true);

    const deleted = await caller.transactions.getById({ id: testTransactionId });
    expect(deleted).toBeUndefined();
  });

  it("filters transactions by type", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create income transaction
    await caller.transactions.create({
      categoryId: testCategoryId,
      amount: 100.00,
      type: "income",
      transactionDate: new Date(),
    });

    const incomeTransactions = await caller.transactions.list({ type: "income" });
    
    expect(Array.isArray(incomeTransactions)).toBe(true);
    incomeTransactions.forEach(t => {
      expect(t.type).toBe("income");
    });
  });
});

describe("stats router", () => {
  it("returns financial summary", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const summary = await caller.stats.summary({});

    expect(summary).toBeDefined();
    expect(typeof summary.totalIncome).toBe("number");
    expect(typeof summary.totalExpense).toBe("number");
    expect(typeof summary.balance).toBe("number");
    expect(summary.balance).toBe(summary.totalIncome - summary.totalExpense);
  });

  it("returns category statistics", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.stats.byCategory({ type: "expense" });

    expect(Array.isArray(stats)).toBe(true);
    stats.forEach(stat => {
      expect(stat).toHaveProperty("categoryId");
      expect(stat).toHaveProperty("categoryName");
      expect(stat).toHaveProperty("total");
      expect(stat).toHaveProperty("count");
      expect(typeof stat.total).toBe("number");
      expect(typeof stat.count).toBe("number");
    });
  });
});
