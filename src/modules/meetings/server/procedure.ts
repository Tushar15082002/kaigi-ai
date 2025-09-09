import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, getTableColumns, ilike, sql } from "drizzle-orm";

import { db } from "@/db";
import { agents, meetings } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/constants";
import { meetingsInsertSchema, meetingsUpdateSchema } from "../schema";

export const meetingsRouter = createTRPCRouter({
    create: protectedProcedure.input(meetingsInsertSchema).mutation(async ({ input, ctx }) => {
        const [createdMeeting] = await db
        .insert(meetings)
        .values({
            ...input,
            userId: ctx.auth.user.id,
        })
        .returning();

        return createdMeeting;
    }),

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

    update: protectedProcedure
        .input(meetingsUpdateSchema)
        .mutation(async ({ ctx, input}) => {
            const [updatedMeeting] = await db
                .update(meetings)
                .set(input)
                .where(
                    and(
                        eq(meetings.id, input.id),
                        eq(meetings.userId, ctx.auth.user.id)
                    ),
                )
                .returning();
            
                if(!updatedMeeting) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Meeting Not Found"
                    });
                }
            return updatedMeeting;
        }),

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
                agent: agents,
                duration: sql<number>`EXTRACT(EPOCH FROM (ended_at - started_at))`.as("duration"),
            })
            .from(meetings)
            .innerJoin(agents, eq(meetings.agentId, agents.id))
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
            .innerJoin(agents, eq(meetings.agentId, agents.id))
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