import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Work Tasks
export const workTasks = pgTable("work_tasks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  hasStations: boolean("has_stations").notNull().default(false),
});

// Work Stations
export const workStations = pgTable("work_stations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  workTaskId: integer("work_task_id").references(() => workTasks.id),
});

// Shifts
export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  order: integer("order").notNull().default(0),
});

// Categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  description: text("description"),
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

// Questions
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  type: text("type").notNull(), // checkbox, radio, text, rating, mood, number
  categoryId: integer("category_id").references(() => categories.id),
  options: json("options"), // For radio buttons and other options
  workTaskId: integer("work_task_id").references(() => workTasks.id),
  showInDashboard: boolean("show_in_dashboard").notNull().default(false),
  dashboardDisplayType: text("dashboard_display_type"), // card, chart, progress, number
  order: integer("order").notNull().default(0),
  isRequired: boolean("is_required").notNull().default(false),
});

// Checklists
export const checklists = pgTable("checklists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  includeWorkTasks: boolean("include_work_tasks").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  order: integer("order").notNull().default(0),
});

// Checklist Work Tasks (junction table)
export const checklistWorkTasks = pgTable("checklist_work_tasks", {
  id: serial("id").primaryKey(),
  checklistId: integer("checklist_id").references(() => checklists.id),
  workTaskId: integer("work_task_id").references(() => workTasks.id),
});

// Checklist Questions (junction table)
export const checklistQuestions = pgTable("checklist_questions", {
  id: serial("id").primaryKey(),
  checklistId: integer("checklist_id").references(() => checklists.id),
  questionId: integer("question_id").references(() => questions.id),
});

// Checklist Responses
export const checklistResponses = pgTable("checklist_responses", {
  id: serial("id").primaryKey(),
  checklistId: integer("checklist_id").references(() => checklists.id),
  operatorName: text("operator_name").notNull(),
  workTaskId: integer("work_task_id").references(() => workTasks.id),
  workStationId: integer("work_station_id").references(() => workStations.id),
  shiftId: integer("shift_id").references(() => shifts.id),
  responses: json("responses").notNull(), // JSON object with question answers
  isCompleted: boolean("is_completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Admin Settings
export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

// Insert schemas
export const insertWorkTaskSchema = createInsertSchema(workTasks).omit({ id: true });
export const insertWorkStationSchema = createInsertSchema(workStations).omit({ id: true });
export const insertShiftSchema = createInsertSchema(shifts).omit({ id: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true });
export const insertChecklistSchema = createInsertSchema(checklists).omit({ id: true });
export const insertChecklistWorkTaskSchema = createInsertSchema(checklistWorkTasks).omit({ id: true });
export const insertChecklistQuestionSchema = createInsertSchema(checklistQuestions).omit({ id: true });
export const insertChecklistResponseSchema = createInsertSchema(checklistResponses).omit({ id: true, createdAt: true });
export const insertAdminSettingSchema = createInsertSchema(adminSettings).omit({ id: true });

// Types
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
export type ChecklistQuestion = typeof checklistQuestions.$inferSelect;
export type InsertChecklistQuestion = z.infer<typeof insertChecklistQuestionSchema>;
export type ChecklistResponse = typeof checklistResponses.$inferSelect;
export type InsertChecklistResponse = z.infer<typeof insertChecklistResponseSchema>;
export type AdminSetting = typeof adminSettings.$inferSelect;
export type InsertAdminSetting = z.infer<typeof insertAdminSettingSchema>;
