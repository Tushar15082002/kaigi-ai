import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, getTableColumns, ilike } from "drizzle-orm";

import { db } from "@/db";
import { meetings } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/constants";
// import { agentsInsertSchema, agentsUpdateSchema } from "../schema";

export const meetingsRouter = createTRPCRouter({
    // create: protectedProcedure.input(agentsInsertSchema).mutation(async ({ input, ctx }) => {
    //     const [createdAgent] = await db
    //     .insert(agents)
    //     .values({
    //         ...input, 
    //         userId: ctx.auth.user.id,
    //     })
    //     .returning();

    //     return createdAgent;
    // }),

    // remove: protectedProcedure
    //     .input(
    //         z.object({ 
    //             id: z.string() 
    //         })
    //     )
    //     .mutation(async ({ ctx, input}) => {
    //         const [removedAgent] = await db
    //             .delete(agents)
    //             .where(
    //                 and(
    //                     eq(agents.id, input.id),
    //                     eq(agents.userId, ctx.auth.user.id)
    //                 ),
    //             )
    //             .returning();
            
    //             if(!removedAgent) {
    //                 throw new TRPCError({
    //                     code: "NOT_FOUND",
    //                     message: "Agent Not Found"
    //                 });
    //             }
    //         return removedAgent;
    //     }),

    // update: protectedProcedure
    //     .input(agentsUpdateSchema)
    //     .mutation(async ({ ctx, input}) => {
    //         const [updatedAgent] = await db
    //             .update(agents)
    //             .set(input)
    //             .where(
    //                 and(
    //                     eq(agents.id, input.id),
    //                     eq(agents.userId, ctx.auth.user.id)
    //                 ),
    //             )
    //             .returning();
            
    //             if(!updatedAgent) {
    //                 throw new TRPCError({
    //                     code: "NOT_FOUND",
    //                     message: "Agent Not Found"
    //                 });
    //             }
    //         return updatedAgent;
    //     }),

    getOne: protectedProcedure
    .input(
        z.object({
            id: z.string()
        })
    )
    .query(async ({ input, ctx }) => {
        const [existingMeeting] = await db
            .select({
                ...getTableColumns(meetings),
            })
            .from(meetings)
            .where(
                and(
                    eq(meetings.id, input.id),
                    eq(meetings.userId, ctx.auth.user.id),
                )
            );

        if(!existingMeeting) {
            throw new TRPCError({ code: "NOT_FOUND", message:"Meeting not found" });
        }
        
        return existingMeeting;
    }),

    getMany: protectedProcedure
    .input(
        z.object({
            page: z.number().default(1),
            pageSize: z
                .number()
                .min(MIN_PAGE_SIZE)
                .max(MAX_PAGE_SIZE)
                .default(DEFAULT_PAGE_SIZE),
            search: z.string().nullish()
        })
    )
    .query(async ({ ctx, input }) => {
        const {search, page, pageSize} = input;

        const data = await db
            .select({
                ...getTableColumns(meetings),
            })
            .from(meetings)
            .where(
                and(
                    eq(meetings.userId, ctx.auth.user.id),
                    input?.search ? ilike(meetings.name , `%${input.search}%`) : undefined,
                )
            )
            .orderBy(desc(meetings.createdAt), desc(meetings.id))
            .limit(pageSize)
            .offset((page-1)*pageSize)

        const [total] = await db
            .select({ count: count() })
            .from(meetings)
            .where(
                and(
                    eq(meetings.userId, ctx.auth.user.id),
                    input?.search ? ilike(meetings.name , `%${input.search}%`) : undefined,
                )
            );

        const totalPages = Math.ceil(total.count / pageSize);

        return {
            items: data,
            total: total.count,
            totalPages,
        };
    }),

});