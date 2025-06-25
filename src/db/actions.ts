"use server";

import { db } from "./drizzle";
import { eventsTable, type InsertEvent, type SelectEvent } from "./schema";
import { eq, desc, isNull, gte, lte, and, sql } from "drizzle-orm";

// Re-export types for easier imports
export type { SelectEvent, InsertEvent };

export async function getCurrentEvent(): Promise<SelectEvent | null> {
  const result = await db
    .select()
    .from(eventsTable)
    .where(isNull(eventsTable.endTime))
    .orderBy(desc(eventsTable.startTime))
    .limit(1);

  return result[0] || null;
}

export async function createEvent(data: InsertEvent): Promise<SelectEvent> {
  // First, check if there's a current ongoing event
  const currentEvent = await getCurrentEvent();

  if (currentEvent) {
    // End the current event with the new event's start time (or current time if no specific start time)
    const endTime = data.startTime || new Date();
    await db
      .update(eventsTable)
      .set({ endTime, updatedAt: new Date() })
      .where(eq(eventsTable.id, currentEvent.id));
  }

  const result = await db.insert(eventsTable).values(data).returning();
  return result[0];
}

export async function endEvent(
  id: number,
  endTime: Date
): Promise<SelectEvent> {
  const result = await db
    .update(eventsTable)
    .set({ endTime, updatedAt: new Date() })
    .where(eq(eventsTable.id, id))
    .returning();

  return result[0];
}

export async function updateEvent(
  id: number,
  data: Partial<InsertEvent>
): Promise<SelectEvent> {
  const result = await db
    .update(eventsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(eventsTable.id, id))
    .returning();

  return result[0];
}

export async function deleteEvent(id: number): Promise<void> {
  await db.delete(eventsTable).where(eq(eventsTable.id, id));
}

export async function getFrequentEventNames(
  limit: number = 10
): Promise<{ name: string; count: number }[]> {
  const result = await db
    .select({
      name: eventsTable.name,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(eventsTable)
    .groupBy(eventsTable.name)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);

  return result;
}

export async function getEventsByDateRange(
  startDate: Date,
  endDate: Date
): Promise<SelectEvent[]> {
  return await db
    .select()
    .from(eventsTable)
    .where(
      and(
        gte(eventsTable.startTime, startDate),
        lte(eventsTable.startTime, endDate)
      )
    )
    .orderBy(desc(eventsTable.startTime));
}

export async function getDayAggregation(
  date: Date
): Promise<{ name: string; duration: number }[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await db
    .select({
      name: eventsTable.name,
      duration: sql<number>`
        COALESCE(
          SUM(
            EXTRACT(EPOCH FROM (
              COALESCE(${eventsTable.endTime}, NOW()) - ${eventsTable.startTime}
            )) / 60
          ), 0
        )
      `.as("duration"),
    })
    .from(eventsTable)
    .where(
      and(
        gte(eventsTable.startTime, startOfDay),
        lte(eventsTable.startTime, endOfDay)
      )
    )
    .groupBy(eventsTable.name)
    .orderBy(desc(sql`duration`));

  return result;
}

export async function getWeekAggregation(
  date: Date
): Promise<{ name: string; duration: number }[]> {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const result = await db
    .select({
      name: eventsTable.name,
      duration: sql<number>`
        COALESCE(
          SUM(
            EXTRACT(EPOCH FROM (
              COALESCE(${eventsTable.endTime}, NOW()) - ${eventsTable.startTime}
            )) / 60
          ), 0
        )
      `.as("duration"),
    })
    .from(eventsTable)
    .where(
      and(
        gte(eventsTable.startTime, startOfWeek),
        lte(eventsTable.startTime, endOfWeek)
      )
    )
    .groupBy(eventsTable.name)
    .orderBy(desc(sql`duration`));

  return result;
}

export async function getAllEvents(
  limit: number = 50,
  offset: number = 0
): Promise<SelectEvent[]> {
  return await db
    .select()
    .from(eventsTable)
    .orderBy(desc(eventsTable.startTime))
    .limit(limit)
    .offset(offset);
}
