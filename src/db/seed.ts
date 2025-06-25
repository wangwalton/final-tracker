import { db } from "./drizzle";
import { eventsTable } from "./schema";

async function seed() {
  try {
    console.log("🌱 Seeding database...");

    // Clear existing data
    await db.delete(eventsTable);

    // Add some sample events
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    await db.insert(eventsTable).values([
      {
        name: "Morning Meeting",
        startTime: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9 AM today
        endTime: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10 AM today
      },
      {
        name: "Development Work",
        startTime: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10 AM today
        endTime: new Date(today.getTime() + 12 * 60 * 60 * 1000), // 12 PM today
      },
      {
        name: "Lunch Break",
        startTime: new Date(today.getTime() + 12 * 60 * 60 * 1000), // 12 PM today
        endTime: new Date(today.getTime() + 13 * 60 * 60 * 1000), // 1 PM today
      },
      {
        name: "Code Review",
        startTime: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 2 PM today
        endTime: new Date(today.getTime() + 15 * 60 * 60 * 1000), // 3 PM today
      },
      {
        name: "Development Work",
        startTime: new Date(today.getTime() + 15 * 60 * 60 * 1000), // 3 PM today
        endTime: new Date(today.getTime() + 17 * 60 * 60 * 1000), // 5 PM today
      },
      // Yesterday's events
      {
        name: "Morning Meeting",
        startTime: new Date(
          today.getTime() - 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000
        ), // 9 AM yesterday
        endTime: new Date(
          today.getTime() - 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000
        ), // 10 AM yesterday
      },
      {
        name: "Client Call",
        startTime: new Date(
          today.getTime() - 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000
        ), // 11 AM yesterday
        endTime: new Date(
          today.getTime() - 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000
        ), // 12 PM yesterday
      },
      {
        name: "Development Work",
        startTime: new Date(
          today.getTime() - 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000
        ), // 1 PM yesterday
        endTime: new Date(
          today.getTime() - 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000
        ), // 4 PM yesterday
      },
    ]);

    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}

seed();
