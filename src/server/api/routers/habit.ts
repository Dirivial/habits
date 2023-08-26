import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const habitRouter = createTRPCRouter({
  getUserHabits: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.habit.findMany({
      where: { userId: ctx.session.user.id },
    });
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        lastPerformed: z.date(),
        streak: z.number(),
        done: z.boolean(),
        goal: z.number(),
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.prisma.habit.update({
        where: { id: input.id },
        data: {
          name: input.name,
          lastPerformed: input.lastPerformed,
          streak: input.streak,
          done: input.done,
          goal: input.goal,
        },
      });
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.prisma.habit.create({
        data: {
          name: input.name,
          userId: ctx.session.user.id,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.prisma.habit.delete({ where: { id: input.id } });
    }),
});
