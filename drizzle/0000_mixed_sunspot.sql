CREATE TABLE "vocabulary_books" (
	"slug" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"edition" text NOT NULL,
	"source_url" text NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vocabulary_words" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_slug" text NOT NULL,
	"number" integer NOT NULL,
	"word" text NOT NULL,
	"meaning" text NOT NULL,
	"is_new" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vocabulary_words_number_positive" CHECK ("vocabulary_words"."number" > 0),
	CONSTRAINT "vocabulary_words_word_nonempty" CHECK (length(trim("vocabulary_words"."word")) > 0),
	CONSTRAINT "vocabulary_words_meaning_nonempty" CHECK (length(trim("vocabulary_words"."meaning")) > 0)
);
--> statement-breakpoint
ALTER TABLE "vocabulary_words" ADD CONSTRAINT "vocabulary_words_book_slug_vocabulary_books_slug_fk" FOREIGN KEY ("book_slug") REFERENCES "public"."vocabulary_books"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "vocabulary_words_book_number_unique" ON "vocabulary_words" USING btree ("book_slug","number");