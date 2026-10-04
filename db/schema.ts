import { sql } from "drizzle-orm";
import { boolean, check, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const vocabularyBooks = pgTable("vocabulary_books", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  edition: text("edition").notNull(),
  sourceUrl: text("source_url").notNull(),
  importedAt: timestamp("imported_at", { withTimezone: true }).defaultNow().notNull(),
});

export const vocabularyWords = pgTable("vocabulary_words", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookSlug: text("book_slug").notNull().references(() => vocabularyBooks.slug),
  number: integer("number").notNull(),
  word: text("word").notNull(),
  meaning: text("meaning").notNull(),
  isNew: boolean("is_new").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("vocabulary_words_book_number_unique").on(table.bookSlug, table.number),
  check("vocabulary_words_number_positive", sql`${table.number} > 0`),
  check("vocabulary_words_word_nonempty", sql`length(trim(${table.word})) > 0`),
  check("vocabulary_words_meaning_nonempty", sql`length(trim(${table.meaning})) > 0`),
]);

export type StoredVocabularyWord = typeof vocabularyWords.$inferSelect;
