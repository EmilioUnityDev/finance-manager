import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  categories: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserCategories(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        type: z.enum(["income", "expense"]),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        icon: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createCategory({
          userId: ctx.user.id,
          ...input,
          isDefault: false,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        icon: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateCategory(id, ctx.user.id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteCategory(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  transactions: router({
    list: protectedProcedure
      .input(z.object({
        categoryId: z.number().optional(),
        type: z.enum(["income", "expense"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getUserTransactions(ctx.user.id, input);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getTransactionById(input.id, ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        categoryId: z.number(),
        amount: z.number().positive(),
        type: z.enum(["income", "expense"]),
        description: z.string().optional(),
        transactionDate: z.date(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Convert amount to cents
        const amountInCents = Math.round(input.amount * 100);
        
        return await db.createTransaction({
          userId: ctx.user.id,
          ...input,
          amount: amountInCents,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        categoryId: z.number().optional(),
        amount: z.number().positive().optional(),
        type: z.enum(["income", "expense"]).optional(),
        description: z.string().optional(),
        transactionDate: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, amount, ...rest } = input;
        const data: any = { ...rest };
        
        // Convert amount to cents if provided
        if (amount !== undefined) {
          data.amount = Math.round(amount * 100);
        }
        
        await db.updateTransaction(id, ctx.user.id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteTransaction(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  stats: router({
    summary: protectedProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const summary = await db.getUserFinancialSummary(
          ctx.user.id,
          input.startDate,
          input.endDate
        );
        
        // Convert from cents to currency units
        return {
          totalIncome: summary.totalIncome / 100,
          totalExpense: summary.totalExpense / 100,
          balance: summary.balance / 100,
        };
      }),

    byCategory: protectedProcedure
      .input(z.object({
        type: z.enum(["income", "expense"]),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const stats = await db.getCategoryStats(
          ctx.user.id,
          input.type,
          input.startDate,
          input.endDate
        );
        
        // Convert from cents to currency units
        return stats.map(s => ({
          ...s,
          total: s.total / 100,
        }));
      }),
  }),

  preferences: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserPreferences(ctx.user.id);
    }),

    update: protectedProcedure
      .input(z.object({
        currency: z.string().length(3).optional(),
        dateFormat: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertUserPreferences(ctx.user.id, input);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
