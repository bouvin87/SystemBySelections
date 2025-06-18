import { pgTable, text, serial, integer, boolean, timestamp, json, varchar, unique, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === MULTI-TENANT CORE TABLES ===

// Tenants - Core multi-tenant table
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  modules: json("modules").$type<string[]>().notNull().default([]), // Active modules: ['checklists', 'maintenance']
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Users - Multi-tenant aware with roles
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id), // Nullable for superadmin
  email: varchar("email", { length: 255 }).notNull(),
  hashedPassword: text("hashed_password").notNull(),
  role: text("role").notNull().default("user"), // superadmin, admin, underadmin, user
  firstName: text("first_name"),
  lastName: text("last_name"),
  isActive: boolean("is_active").notNull().default(true),
  lockRole: boolean("lock_role").notNull().default(false), // When true, user cannot change their role
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === MODULE: CHECKLISTS ===

// Work Tasks (tenant-scoped)
export const workTasks = pgTable("work_tasks", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  hasStations: boolean("has_stations").notNull().default(false),
});

// Work Stations (tenant-scoped)
export const workStations = pgTable("work_stations", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  workTaskId: integer("work_task_id").references(() => workTasks.id),
});

// Shifts (tenant-scoped)
export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  order: integer("order").notNull().default(0),
});

// Checklists (tenant-scoped)
export const checklists = pgTable("checklists", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  includeWorkTasks: boolean("include_work_tasks").notNull().default(true),
  includeWorkStations: boolean("include_work_stations").notNull().default(true),
  includeShifts: boolean("include_shifts").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  showInMenu: boolean("show_in_menu").notNull().default(false),
  hasDashboard: boolean("has_dashboard").notNull().default(false),
  order: integer("order").notNull().default(0),
  icon: text("icon"), // Lucide icon name
});

// Categories (tenant-scoped, belongs to specific checklists)
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  checklistId: integer("checklist_id").references(() => checklists.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  icon: text("icon"), // Lucide icon name
});

// Questions (tenant-scoped, belongs to categories within checklists)
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  text: text("text").notNull(),
  type: text("type").notNull(), // text, val, nummer, ja_nej, datum, fil, stjärnor, humör, check
  options: json("options"), // For radio buttons and other options
  validation: json("validation"), // Validation rules
  showInDashboard: boolean("show_in_dashboard").notNull().default(false),
  dashboardDisplayType: text("dashboard_display_type"), // card, chart, progress, number
  hideInView: boolean("hide_in_view").notNull().default(false),
  order: integer("order").notNull().default(0),
  isRequired: boolean("is_required").notNull().default(false),
});

// Question Work Tasks - Many-to-many relation between questions and work tasks
// If no entries exist for a question, it's shown for all work tasks
export const questionWorkTasks = pgTable("question_work_tasks", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  questionId: integer("question_id").references(() => questions.id).notNull(),
  workTaskId: integer("work_task_id").references(() => workTasks.id).notNull(),
}, (table) => ({
  uniqueQuestionWorkTask: unique().on(table.questionId, table.workTaskId),
}));

// Checklist Work Tasks (tenant-scoped junction table)
export const checklistWorkTasks = pgTable("checklist_work_tasks", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  checklistId: integer("checklist_id").references(() => checklists.id),
  workTaskId: integer("work_task_id").references(() => workTasks.id),
});

// Checklist Responses (tenant-scoped)
export const checklistResponses = pgTable("checklist_responses", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  checklistId: integer("checklist_id").references(() => checklists.id),
  operatorName: text("operator_name").notNull(),
  workTaskId: integer("work_task_id").references(() => workTasks.id),
  workStationId: integer("work_station_id").references(() => workStations.id),
  shiftId: integer("shift_id").references(() => shifts.id),
  responses: json("responses").notNull(), // JSON object with question answers
  isCompleted: boolean("is_completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Admin Settings (tenant-scoped)
export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  key: text("key").notNull(),
  value: text("value").notNull(),
}, (table) => ({
  keyTenantUnique: unique().on(table.key, table.tenantId),
}));

// === INSERT SCHEMAS ===

// Core multi-tenant schemas
export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });

// Checklist module schemas
export const insertWorkTaskSchema = createInsertSchema(workTasks).omit({ id: true });
export const insertWorkStationSchema = createInsertSchema(workStations).omit({ id: true });
export const insertShiftSchema = createInsertSchema(shifts).omit({ id: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true });
export const insertChecklistSchema = createInsertSchema(checklists).omit({ id: true });
export const insertChecklistWorkTaskSchema = createInsertSchema(checklistWorkTasks).omit({ id: true });
export const insertChecklistResponseSchema = createInsertSchema(checklistResponses).omit({ id: true, createdAt: true });
export const insertAdminSettingSchema = createInsertSchema(adminSettings).omit({ id: true });

// Question Work Tasks schemas
export const insertQuestionWorkTaskSchema = createInsertSchema(questionWorkTasks).omit({
  id: true,
});

// Login/Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Frontend user creation schema (with password instead of hashedPassword)
export const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['admin', 'user']).default('user'),
  password: z.string().min(6),
});

// === TYPES ===

// Core multi-tenant types
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Checklist module types
export type WorkTask = typeof workTasks.$inferSelect;
export type InsertWorkTask = z.infer<typeof insertWorkTaskSchema>;
export type WorkStation = typeof workStations.$inferSelect;
export type InsertWorkStation = z.infer<typeof insertWorkStationSchema>;
export type Shift = typeof shifts.$inferSelect;
export type InsertShift = z.infer<typeof insertShiftSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Checklist = typeof checklists.$inferSelect;
export type InsertChecklist = z.infer<typeof insertChecklistSchema>;
export type ChecklistWorkTask = typeof checklistWorkTasks.$inferSelect;
export type InsertChecklistWorkTask = z.infer<typeof insertChecklistWorkTaskSchema>;
export type ChecklistResponse = typeof checklistResponses.$inferSelect;
export type InsertChecklistResponse = z.infer<typeof insertChecklistResponseSchema>;
export type AdminSetting = typeof adminSettings.$inferSelect;
export type InsertAdminSetting = z.infer<typeof insertAdminSettingSchema>;
export type QuestionWorkTask = typeof questionWorkTasks.$inferSelect;
export type InsertQuestionWorkTask = z.infer<typeof insertQuestionWorkTaskSchema>;

// === ACTION ITEMS MODULE ===

// Action Items Module - Enums
export const actionStatusEnum = pgEnum('action_status', ['new', 'in_progress', 'done']);
export const actionPriorityEnum = pgEnum('action_priority', ['low', 'medium', 'high', 'critical']);

// Action Items Table
export const actionItems = pgTable("action_items", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: actionStatusEnum("status").notNull().default('new'),
  priority: actionPriorityEnum("priority").notNull().default('medium'),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  checklistResponseId: integer("checklist_response_id").references(() => checklistResponses.id),
  questionId: integer("question_id").references(() => questions.id),
  createdByUserId: integer("created_by_user_id").notNull().references(() => users.id),
  assignedToUserId: integer("assigned_to_user_id").references(() => users.id),
  locationId: integer("location_id").references(() => workStations.id),
  workTaskId: integer("work_task_id").references(() => workTasks.id),
});

// Action Comments Table
export const actionComments = pgTable("action_comments", {
  id: serial("id").primaryKey(),
  actionItemId: integer("action_item_id").notNull().references(() => actionItems.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations for Action Items
export const actionItemsRelations = relations(actionItems, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [actionItems.tenantId],
    references: [tenants.id],
  }),
  createdBy: one(users, {
    fields: [actionItems.createdByUserId],
    references: [users.id],
    relationName: "actionItemCreatedBy",
  }),
  assignedTo: one(users, {
    fields: [actionItems.assignedToUserId],
    references: [users.id],
    relationName: "actionItemAssignedTo",
  }),
  checklistResponse: one(checklistResponses, {
    fields: [actionItems.checklistResponseId],
    references: [checklistResponses.id],
  }),
  question: one(questions, {
    fields: [actionItems.questionId],
    references: [questions.id],
  }),
  location: one(workStations, {
    fields: [actionItems.locationId],
    references: [workStations.id],
  }),
  workTask: one(workTasks, {
    fields: [actionItems.workTaskId],
    references: [workTasks.id],
  }),
  comments: many(actionComments),
}));

export const actionCommentsRelations = relations(actionComments, ({ one }) => ({
  actionItem: one(actionItems, {
    fields: [actionComments.actionItemId],
    references: [actionItems.id],
  }),
  user: one(users, {
    fields: [actionComments.userId],
    references: [users.id],
  }),
}));

// Schemas for Action Items
export const insertActionItemSchema = createInsertSchema(actionItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectActionItemSchema = createInsertSchema(actionItems);

export const insertActionCommentSchema = createInsertSchema(actionComments).omit({
  id: true,
  createdAt: true,
});

export const selectActionCommentSchema = createInsertSchema(actionComments);

// Types for Action Items
export type ActionItem = typeof actionItems.$inferSelect;
export type InsertActionItem = z.infer<typeof insertActionItemSchema>;
export type ActionComment = typeof actionComments.$inferSelect;
export type InsertActionComment = z.infer<typeof insertActionCommentSchema>;

// Auth types
export type LoginRequest = z.infer<typeof loginSchema>;
export type CreateUserRequest = z.infer<typeof createUserSchema>;

// JWT payload type
export interface JWTPayload {
  userId: number;
  tenantId?: number;
  role: string;
  email: string;
  firstName?: string;
  lastName?: string;
}
