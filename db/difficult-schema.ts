import { sql } from "drizzle-orm";
import { check, integer, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";

export const difficultWords = pgTable("difficult_words", {
  learnerId: uuid("learner_id").notNull(),
  wordNumber: integer("word_number").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.learnerId, table.wordNumber] }),
  check("difficult_words_number_check", sql`${table.wordNumber} BETWEEN 1 AND 1900`),
]);
