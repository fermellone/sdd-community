import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const providers = pgTable("providers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const phases = pgTable("phases", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  responsibility: text("responsibility").notNull(),
  description: text("description").notNull(),
  slug: text("slug").notNull().unique(),
});

export const models = pgTable(
  "models",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    providerId: integer("provider_id")
      .notNull()
      .references(() => providers.id),
  },
  (table) => ({
    uqModelNameProvider: unique("uq_model_name_provider").on(
      table.name,
      table.providerId,
    ),
  }),
);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
});

export const votes = pgTable(
  "votes",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    phaseId: integer("phase_id")
      .notNull()
      .references(() => phases.id),
    modelId: integer("model_id")
      .notNull()
      .references(() => models.id),
    providerId: integer("provider_id")
      .notNull()
      .references(() => providers.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    uqVoteUserPhase: unique("uq_vote_user_phase").on(
      table.userId,
      table.phaseId,
    ),
  }),
);

export const voteHistory = pgTable("vote_history", {
  id: serial("id").primaryKey(),
  voteId: integer("vote_id")
    .notNull()
    .references(() => votes.id),
  oldModelId: integer("old_model_id").references(() => models.id),
  oldProviderId: integer("old_provider_id").references(() => providers.id),
  newModelId: integer("new_model_id")
    .notNull()
    .references(() => models.id),
  newProviderId: integer("new_provider_id")
    .notNull()
    .references(() => providers.id),
  changedAt: timestamp("changed_at").defaultNow(),
});
