import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { cents, id, timestamps } from "./columns";
import {
  categoryColor,
  categoryNature,
  kinship,
  memberRole,
  memberStatus,
  paymentType,
  personColor,
  splitRule,
} from "./enums";

export const families = pgTable("families", {
  id: id(),
  name: text("name").notNull(),
  defaultSplitRule: splitRule("default_split_rule").notNull().default("igual"),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id),
  ...timestamps,
});

export const familyMembers = pgTable(
  "family_members",
  {
    id: id(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    /** Nulo = dependente sem login. */
    userId: text("user_id").references(() => user.id),
    displayName: text("display_name").notNull(),
    role: memberRole("role").notNull().default("membro"),
    kinship: kinship("kinship").notNull().default("outro"),
    color: personColor("color").notNull().default("person-a"),
    participatesInSplit: boolean("participates_in_split").notNull().default(true),
    /** Pontos-base: 5000 = 50,00%. */
    customPercent: integer("custom_percent"),
    status: memberStatus("status").notNull().default("ativo"),
    ...timestamps,
  },
  (t) => [unique("family_members_family_user_uq").on(t.familyId, t.userId)],
);

export const familyInvites = pgTable("family_invites", {
  id: id(),
  familyId: uuid("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  email: text("email"),
  role: memberRole("role").notNull().default("membro"),
  kinship: kinship("kinship").notNull().default("outro"),
  participatesInSplit: boolean("participates_in_split").notNull().default(true),
  tokenHash: text("token_hash").notNull().unique(),
  invitedBy: uuid("invited_by")
    .notNull()
    .references(() => familyMembers.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  ...timestamps,
});

export const categories = pgTable(
  "categories",
  {
    id: id(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: categoryColor("color").notNull().default("chart-1"),
    nature: categoryNature("nature").notNull().default("variavel"),
    monthlyLimitCents: cents("monthly_limit_cents"),
    archived: boolean("archived").notNull().default(false),
    ...timestamps,
  },
  (t) => [unique("categories_family_name_uq").on(t.familyId, t.name)],
);

export const paymentMethods = pgTable("payment_methods", {
  id: id(),
  familyId: uuid("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: paymentType("type").notNull().default("conta"),
  ownerMemberId: uuid("owner_member_id").references(() => familyMembers.id),
  ...timestamps,
});
