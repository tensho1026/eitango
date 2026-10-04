CREATE TABLE "difficult_words" (
	"learner_id" uuid NOT NULL,
	"word_number" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "difficult_words_learner_id_word_number_pk" PRIMARY KEY("learner_id","word_number"),
	CONSTRAINT "difficult_words_number_check" CHECK ("difficult_words"."word_number" BETWEEN 1 AND 1900)
);
