import { pgTable, pgEnum, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { shopsTable } from "./shops";
import { userRolesTable } from "./role-permissions";

export const userRoleEnum = pgEnum("user_role", ["admin", "seller", "viewer"]);

export const usersTable = pgTable("users", {
  id:           serial("id").primaryKey(),
  supabaseUid:  text("supabase_uid").unique(),
  name:         text("name").notNull(),
  email:        text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  role:         userRoleEnum("role").notNull().default("seller"),
  userRoleId:   text("user_role_id").references(() => userRolesTable.id),
  isActive:     boolean("is_active").notNull().default(true),
  shopId:       integer("shop_id").references(() => shopsTable.id).notNull(),
  createdAt:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
export type UserRole = typeof userRoleEnum.enumValues[number];
