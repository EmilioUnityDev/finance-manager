import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: "test-user-categories",
    email: "test-categories@example.com",
    name: "Test User Categories",
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

describe("categories router", () => {
  let testCategoryId: number;

  it("creates a category successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const category = await caller.categories.create({
      name: "Test Food",
      type: "expense",
      color: "#10b981",
    });

    expect(category).toBeDefined();
    expect(category.name).toBe("Test Food");
    expect(category.type).toBe("expense");
    expect(category.color).toBe("#10b981");
    expect(category.userId).toBe(1);
    
    testCategoryId = category.id;
  });

  it("lists user categories", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const categories = await caller.categories.list();

    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThan(0);
    
    const createdCategory = categories.find(c => c.id === testCategoryId);
    expect(createdCategory).toBeDefined();
    expect(createdCategory?.name).toBe("Test Food");
  });

  it("updates a category", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.categories.update({
      id: testCategoryId,
      name: "Updated Food",
      color: "#3b82f6",
    });

    expect(result.success).toBe(true);

    const categories = await caller.categories.list();
    const updated = categories.find(c => c.id === testCategoryId);
    
    expect(updated?.name).toBe("Updated Food");
    expect(updated?.color).toBe("#3b82f6");
  });

  it("creates income category", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const category = await caller.categories.create({
      name: "Test Salary",
      type: "income",
      color: "#f59e0b",
    });

    expect(category).toBeDefined();
    expect(category.type).toBe("income");
    expect(category.name).toBe("Test Salary");
  });

  it("deletes a category", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.categories.delete({ id: testCategoryId });
    expect(result.success).toBe(true);

    const categories = await caller.categories.list();
    const deleted = categories.find(c => c.id === testCategoryId);
    expect(deleted).toBeUndefined();
  });

  it("validates color format", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.categories.create({
        name: "Invalid Color",
        type: "expense",
        color: "invalid",
      })
    ).rejects.toThrow();
  });

  it("validates category name", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.categories.create({
        name: "",
        type: "expense",
        color: "#10b981",
      })
    ).rejects.toThrow();
  });
});
