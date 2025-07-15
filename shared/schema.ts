import { pgTable, text, serial, integer, boolean, timestamp, json, varchar, unique, pgEnum, uuid } from "drizzle-orm/pg-core";
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

// === ROLE MANAGEMENT ===

// Roles - Multi-tenant aware
export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User-Role relationship table
export const userHasRoles = pgTable("user_has_roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  roleId: uuid("role_id").references(() => roles.id).notNull(),
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

// Departments (tenant-scoped)
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).notNull().default("#3b82f6"), // hex color
  isActive: boolean("is_active").notNull().default(true),
  order: integer("order").notNull().default(0),
  responsibleUserId: integer("responsible_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User-Department relationship table
export const userHasDepartments = pgTable("user_has_departments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  departmentId: integer("department_id").references(() => departments.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Checklists (tenant-scoped)
export const checklists = pgTable("checklists", {
  id: uuid("id").primaryKey().defaultRandom(),
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
  checklistId: uuid("checklist_id").references(() => checklists.id).notNull(),
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
  checklistId: uuid("checklist_id").references(() => checklists.id),
  workTaskId: integer("work_task_id").references(() => workTasks.id),
});

// Checklist Responses (tenant-scoped)
export const checklistResponses = pgTable("checklist_responses", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  checklistId: uuid("checklist_id").references(() => checklists.id),
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

// Deviation Settings (tenant-scoped)
export const deviationSettings = pgTable("deviation_settings", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  showCreateButtonInMenu: boolean("show_create_button_in_menu").default(false),
  useWorkTasks: boolean("use_work_tasks").default(true),
  useWorkStations: boolean("use_work_stations").default(true),
  usePriorities: boolean("use_priorities").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === INSERT SCHEMAS ===

// Core multi-tenant schemas
export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });

// Checklist module schemas
export const insertWorkTaskSchema = createInsertSchema(workTasks).omit({ id: true });
export const insertWorkStationSchema = createInsertSchema(workStations).omit({ id: true });
export const insertShiftSchema = createInsertSchema(shifts).omit({ id: true });
export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true, tenantId: true, createdAt: true, updatedAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true });
export const insertChecklistSchema = createInsertSchema(checklists).omit({ id: true });
export const insertChecklistWorkTaskSchema = createInsertSchema(checklistWorkTasks).omit({ id: true });
export const insertChecklistResponseSchema = createInsertSchema(checklistResponses).omit({ id: true, createdAt: true });
export const insertAdminSettingSchema = createInsertSchema(adminSettings).omit({ id: true });
export const insertDeviationSettingSchema = createInsertSchema(deviationSettings).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});


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
  isActive: z.boolean().optional().default(true),
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
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
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
export type DeviationSetting = typeof deviationSettings.$inferSelect;
export type InsertDeviationSetting = z.infer<typeof insertDeviationSettingSchema>;

export type QuestionWorkTask = typeof questionWorkTasks.$inferSelect;
export type InsertQuestionWorkTask = z.infer<typeof insertQuestionWorkTaskSchema>;

// === DEVIATIONS MODULE ===
export const deviationTypes = pgTable("deviation_types", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#ef4444"), // Default red color
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const deviationPriorities = pgTable("deviation_priorities", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 50 }).notNull(),
  color: varchar("color", { length: 7 }).notNull(), // hex color
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const deviationStatuses = pgTable("deviation_statuses", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 50 }).notNull(),
  color: varchar("color", { length: 7 }).notNull(), // hex color
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false),
  isCompleted: boolean("is_completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const deviations = pgTable("deviations", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  title: text("title").notNull(),
  description: text("description"),
  deviationTypeId: integer("deviation_type_id").notNull().references(() => deviationTypes.id),
  priorityId: integer("priority_id").references(() => deviationPriorities.id),
  statusId: integer("status_id").references(() => deviationStatuses.id),
  assignedToUserId: integer("assigned_to_user_id").references(() => users.id),
  createdByUserId: integer("created_by_user_id").notNull().references(() => users.id),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  workTaskId: integer("work_task_id").references(() => workTasks.id),
  locationId: integer("location_id").references(() => workStations.id),
  departmentId: integer("department_id").references(() => departments.id),
  isHidden: boolean("is_hidden").notNull().default(false), // Hidden from normal users
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const deviationComments = pgTable("deviation_comments", {
  id: serial("id").primaryKey(),
  deviationId: integer("deviation_id").notNull().references(() => deviations.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Deviation Activity Log - Track all changes to deviations
export const deviationLogs = pgTable("deviation_logs", {
  id: serial("id").primaryKey(),
  deviationId: integer("deviation_id").notNull().references(() => deviations.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id),
  action: text("action").notNull(), // 'created', 'updated', 'status_changed', 'assigned', etc.
  field: text("field"), // Which field was changed (e.g., 'title', 'description', 'statusId')
  oldValue: text("old_value"), // Previous value (stored as text)
  newValue: text("new_value"), // New value (stored as text)
  description: text("description"), // Human-readable description of the change
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Deviation Attachments - Store file attachments for deviations
export const deviationAttachments = pgTable("deviation_attachments", {
  id: serial("id").primaryKey(),
  deviationId: integer("deviation_id").notNull().references(() => deviations.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id), // Who uploaded the file
  fileName: text("file_name").notNull(), // Original filename
  fileSize: integer("file_size").notNull(), // File size in bytes
  mimeType: text("mime_type").notNull(), // MIME type (image/jpeg, application/pdf, etc.)
  filePath: text("file_path").notNull(), // Path to stored file
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Custom Fields - Admin-defined extra fields for deviations
export const customFields = pgTable("custom_fields", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(), // Field name/label
  fieldType: text("field_type").notNull(), // 'text', 'number', 'checkbox', 'date', 'select'
  options: json("options").$type<string[]>(), // For select type: ["Val1", "Val2", "Val3"]
  isRequired: boolean("is_required").notNull().default(false),
  order: integer("order").notNull().default(0), // Display order
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Custom Field Type Mappings - Link custom fields to deviation types
export const customFieldTypeMappings = pgTable("custom_field_type_mappings", {
  id: serial("id").primaryKey(),
  customFieldId: integer("custom_field_id").notNull().references(() => customFields.id, { onDelete: "cascade" }),
  deviationTypeId: integer("deviation_type_id").notNull().references(() => deviationTypes.id, { onDelete: "cascade" }),
}, (table) => ({
  uniqueMapping: unique().on(table.customFieldId, table.deviationTypeId),
}));

// Custom Field Values - Store actual values for each deviation
export const customFieldValues = pgTable("custom_field_values", {
  id: serial("id").primaryKey(),
  deviationId: integer("deviation_id").notNull().references(() => deviations.id, { onDelete: "cascade" }),
  customFieldId: integer("custom_field_id").notNull().references(() => customFields.id, { onDelete: "cascade" }),
  value: text("value"), // Store all values as text, convert based on field type
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  uniqueValue: unique().on(table.deviationId, table.customFieldId),
}));

// Relations for Deviations
export const deviationTypesRelations = relations(deviationTypes, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [deviationTypes.tenantId],
    references: [tenants.id],
  }),
  deviations: many(deviations),
}));

export const deviationsRelations = relations(deviations, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [deviations.tenantId],
    references: [tenants.id],
  }),
  deviationType: one(deviationTypes, {
    fields: [deviations.deviationTypeId],
    references: [deviationTypes.id],
  }),
  priority: one(deviationPriorities, {
    fields: [deviations.priorityId],
    references: [deviationPriorities.id],
  }),
  status: one(deviationStatuses, {
    fields: [deviations.statusId],
    references: [deviationStatuses.id],
  }),
  createdBy: one(users, {
    fields: [deviations.createdByUserId],
    references: [users.id],
    relationName: "deviationCreatedBy",
  }),
  assignedTo: one(users, {
    fields: [deviations.assignedToUserId],
    references: [users.id],
    relationName: "deviationAssignedTo",
  }),
  location: one(workStations, {
    fields: [deviations.locationId],
    references: [workStations.id],
  }),
  workTask: one(workTasks, {
    fields: [deviations.workTaskId],
    references: [workTasks.id],
  }),
  comments: many(deviationComments),
  logs: many(deviationLogs),
  attachments: many(deviationAttachments),
  customFieldValues: many(customFieldValues),
}));

export const deviationCommentsRelations = relations(deviationComments, ({ one }) => ({
  deviation: one(deviations, {
    fields: [deviationComments.deviationId],
    references: [deviations.id],
  }),
  user: one(users, {
    fields: [deviationComments.userId],
    references: [users.id],
  }),
}));

// Custom Fields Relations
export const customFieldsRelations = relations(customFields, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [customFields.tenantId],
    references: [tenants.id],
  }),
  typeMappings: many(customFieldTypeMappings),
  values: many(customFieldValues),
}));

export const customFieldTypeMappingsRelations = relations(customFieldTypeMappings, ({ one }) => ({
  customField: one(customFields, {
    fields: [customFieldTypeMappings.customFieldId],
    references: [customFields.id],
  }),
  deviationType: one(deviationTypes, {
    fields: [customFieldTypeMappings.deviationTypeId],
    references: [deviationTypes.id],
  }),
}));

export const customFieldValuesRelations = relations(customFieldValues, ({ one }) => ({
  deviation: one(deviations, {
    fields: [customFieldValues.deviationId],
    references: [deviations.id],
  }),
  customField: one(customFields, {
    fields: [customFieldValues.customFieldId],
    references: [customFields.id],
  }),
}));

export const deviationLogsRelations = relations(deviationLogs, ({ one }) => ({
  deviation: one(deviations, {
    fields: [deviationLogs.deviationId],
    references: [deviations.id],
  }),
  user: one(users, {
    fields: [deviationLogs.userId],
    references: [users.id],
  }),
}));

export const deviationAttachmentsRelations = relations(deviationAttachments, ({ one }) => ({
  deviation: one(deviations, {
    fields: [deviationAttachments.deviationId],
    references: [deviations.id],
  }),
  user: one(users, {
    fields: [deviationAttachments.userId],
    references: [users.id],
  }),
}));

// Role relations
export const rolesRelations = relations(roles, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [roles.tenantId],
    references: [tenants.id],
  }),
  userHasRoles: many(userHasRoles),
}));

export const userHasRolesRelations = relations(userHasRoles, ({ one }) => ({
  user: one(users, {
    fields: [userHasRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userHasRoles.roleId],
    references: [roles.id],
  }),
}));

export const userHasDepartmentsRelations = relations(userHasDepartments, ({ one }) => ({
  user: one(users, {
    fields: [userHasDepartments.userId],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [userHasDepartments.departmentId],
    references: [departments.id],
  }),
}));

// Deviation types
export type DeviationType = typeof deviationTypes.$inferSelect;
export type InsertDeviationType = z.infer<typeof insertDeviationTypeSchema>;
export type DeviationPriority = typeof deviationPriorities.$inferSelect;
export type DeviationStatus = typeof deviationStatuses.$inferSelect;
export type Deviation = typeof deviations.$inferSelect;
export type InsertDeviation = z.infer<typeof insertDeviationSchema>;
export type DeviationComment = typeof deviationComments.$inferSelect;
export type InsertDeviationComment = z.infer<typeof insertDeviationCommentSchema>;
export type DeviationLog = typeof deviationLogs.$inferSelect;
export type InsertDeviationLog = z.infer<typeof insertDeviationLogSchema>;
export type DeviationAttachment = typeof deviationAttachments.$inferSelect;
export type InsertDeviationAttachment = z.infer<typeof insertDeviationAttachmentSchema>;


// Deviation schemas
export const insertDeviationTypeSchema = createInsertSchema(deviationTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDeviationSchema = createInsertSchema(deviations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export const insertDeviationCommentSchema = createInsertSchema(deviationComments).omit({
  id: true,
  createdAt: true,
});

export const insertDeviationLogSchema = createInsertSchema(deviationLogs).omit({
  id: true,
  createdAt: true,
});

export const insertDeviationAttachmentSchema = createInsertSchema(deviationAttachments).omit({
  id: true,
  createdAt: true,
});

// Custom Fields types and schemas
export type CustomField = typeof customFields.$inferSelect;
export type InsertCustomField = z.infer<typeof insertCustomFieldSchema>;
export type CustomFieldTypeMapping = typeof customFieldTypeMappings.$inferSelect;
export type InsertCustomFieldTypeMapping = z.infer<typeof insertCustomFieldTypeMappingSchema>;
export type CustomFieldValue = typeof customFieldValues.$inferSelect;
export type InsertCustomFieldValue = z.infer<typeof insertCustomFieldValueSchema>;

export const insertCustomFieldSchema = createInsertSchema(customFields).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  options: z.array(z.string()).optional(), // JSON array validation for select options
});

export const insertCustomFieldTypeMappingSchema = createInsertSchema(customFieldTypeMappings).omit({
  id: true,
});

export const insertCustomFieldValueSchema = createInsertSchema(customFieldValues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDeviationPrioritySchema = createInsertSchema(deviationPriorities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDeviationStatusSchema = createInsertSchema(deviationStatuses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDeviationPriority = z.infer<typeof insertDeviationPrioritySchema>;
export type InsertDeviationStatus = z.infer<typeof insertDeviationStatusSchema>;

// Role schemas
export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
});

export const insertUserHasRoleSchema = createInsertSchema(userHasRoles).omit({
  id: true,
  createdAt: true,
});

export const insertUserHasDepartmentSchema = createInsertSchema(userHasDepartments).omit({
  id: true,
  createdAt: true,
});

// Role types
export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type UserHasRole = typeof userHasRoles.$inferSelect;
export type InsertUserHasRole = z.infer<typeof insertUserHasRoleSchema>;
export type UserHasDepartment = typeof userHasDepartments.$inferSelect;
export type InsertUserHasDepartment = z.infer<typeof insertUserHasDepartmentSchema>;

// === SYSTEM ANNOUNCEMENTS ===
export const systemAnnouncements = pgTable('system_announcements', {
  id: serial('id').primaryKey(),
  message: text('message').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: integer('created_by').notNull().references(() => users.id),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  updatedBy: integer('updated_by').notNull().references(() => users.id),
});

export type InsertSystemAnnouncement = typeof systemAnnouncements.$inferInsert;
export type SystemAnnouncement = typeof systemAnnouncements.$inferSelect;



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

// ============== KANBAN MODULE ==============
export type KanbanBoardWithOwner = KanbanBoard & {
  ownerUser?: {
    id: number;
    firstName: string;
    lastName: string | null;
  };
};
export const kanbanBoards = pgTable("kanban_boards", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  ownerUserId: integer("owner_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").default("ClipboardList"),
  isPublic: boolean("is_public").default(false),
  settingsJson: text("settings_json"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const kanbanColumns = pgTable("kanban_columns", {
  id: uuid("id").primaryKey().defaultRandom(),
  boardId: uuid("board_id").references(() => kanbanBoards.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  icon: text("icon").default("List"),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const kanbanCards = pgTable("kanban_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  columnId: uuid("column_id").references(() => kanbanColumns.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  icon: text("icon").default("FileText"),
  position: integer("position").notNull(),
  dueDate: timestamp("due_date"),
  completed: boolean("completed").default(false),
  assignedUserId: integer("assigned_user_id").references(() => users.id, { onDelete: "set null" }),
  priorityLevel: text("priority_level").default("medium"), // low, medium, high, urgent
  labels: text("labels").array(),
  attachments: text("attachments").array(),
  checklistItems: text("checklist_items"), // JSON string
  commentsEnabled: boolean("comments_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const kanbanBoardShares = pgTable("kanban_board_shares", {
  id: uuid("id").primaryKey().defaultRandom(),
  boardId: uuid("board_id").references(() => kanbanBoards.id, { onDelete: "cascade" }).notNull(),
  sharedWithType: text("shared_with_type").notNull(), // "user" | "role" | "department" | "public"
  referenceId: text("reference_id"), // user_id, role_id, department_id (nullable for public)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userKanbanPreferences = pgTable("user_kanban_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  boardId: uuid("board_id").references(() => kanbanBoards.id, { onDelete: "cascade" }).notNull(),
  showInQuickAccess: boolean("show_in_quick_access").default(false).notNull(),
  pinnedPosition: integer("pinned_position").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserBoard: unique("unique_user_board").on(table.userId, table.boardId),
}));

// Kanban Card Comments
export const kanbanCardComments = pgTable("kanban_card_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  cardId: uuid("card_id").references(() => kanbanCards.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Kanban Card Attachments
export const kanbanCardAttachments = pgTable("kanban_card_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  cardId: uuid("card_id").references(() => kanbanCards.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  filePath: text("file_path").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Kanban Relations
export const kanbanBoardRelations = relations(kanbanBoards, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [kanbanBoards.tenantId],
    references: [tenants.id],
  }),
  owner: one(users, {
    fields: [kanbanBoards.ownerUserId],
    references: [users.id],
  }),
  columns: many(kanbanColumns),
  shares: many(kanbanBoardShares),
}));

export const kanbanColumnRelations = relations(kanbanColumns, ({ one, many }) => ({
  board: one(kanbanBoards, {
    fields: [kanbanColumns.boardId],
    references: [kanbanBoards.id],
  }),
  cards: many(kanbanCards),
}));

export const kanbanCardRelations = relations(kanbanCards, ({ one, many }) => ({
  column: one(kanbanColumns, {
    fields: [kanbanCards.columnId],
    references: [kanbanColumns.id],
  }),
  assignedUser: one(users, {
    fields: [kanbanCards.assignedUserId],
    references: [users.id],
  }),
  comments: many(kanbanCardComments),
  attachments: many(kanbanCardAttachments),
}));

export const kanbanCardCommentRelations = relations(kanbanCardComments, ({ one }) => ({
  card: one(kanbanCards, {
    fields: [kanbanCardComments.cardId],
    references: [kanbanCards.id],
  }),
  user: one(users, {
    fields: [kanbanCardComments.userId],
    references: [users.id],
  }),
}));

export const kanbanCardAttachmentRelations = relations(kanbanCardAttachments, ({ one }) => ({
  card: one(kanbanCards, {
    fields: [kanbanCardAttachments.cardId],
    references: [kanbanCards.id],
  }),
  user: one(users, {
    fields: [kanbanCardAttachments.userId],
    references: [users.id],
  }),
}));

export const kanbanBoardShareRelations = relations(kanbanBoardShares, ({ one }) => ({
  board: one(kanbanBoards, {
    fields: [kanbanBoardShares.boardId],
    references: [kanbanBoards.id],
  }),
}));

export const userKanbanPreferenceRelations = relations(userKanbanPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userKanbanPreferences.userId],
    references: [users.id],
  }),
  board: one(kanbanBoards, {
    fields: [userKanbanPreferences.boardId],
    references: [kanbanBoards.id],
  }),
}));

// Kanban Types
export type KanbanBoard = typeof kanbanBoards.$inferSelect;
export type InsertKanbanBoard = z.infer<typeof insertKanbanBoardSchema>;
export type KanbanColumn = typeof kanbanColumns.$inferSelect;
export type InsertKanbanColumn = z.infer<typeof insertKanbanColumnSchema>;
export type KanbanCard = typeof kanbanCards.$inferSelect;
export type InsertKanbanCard = z.infer<typeof insertKanbanCardSchema>;
export type KanbanBoardShare = typeof kanbanBoardShares.$inferSelect;
export type InsertKanbanBoardShare = z.infer<typeof insertKanbanBoardShareSchema>;
export type UserKanbanPreference = typeof userKanbanPreferences.$inferSelect;
export type InsertUserKanbanPreference = z.infer<typeof insertUserKanbanPreferenceSchema>;
export type KanbanCardComment = typeof kanbanCardComments.$inferSelect;
export type InsertKanbanCardComment = z.infer<typeof insertKanbanCardCommentSchema>;
export type KanbanCardAttachment = typeof kanbanCardAttachments.$inferSelect;
export type InsertKanbanCardAttachment = z.infer<typeof insertKanbanCardAttachmentSchema>;

// Kanban Schemas
export const insertKanbanBoardSchema = createInsertSchema(kanbanBoards).omit({
  id: true,
  createdAt: true,
});

export const insertKanbanColumnSchema = createInsertSchema(kanbanColumns).omit({
  id: true,
  createdAt: true,
});

export const insertKanbanCardSchema = createInsertSchema(kanbanCards).omit({
  id: true,
  createdAt: true,
}).extend({
  labels: z.array(z.string()).optional(),
  attachments: z.array(z.string()).optional(),
});

export const insertKanbanBoardShareSchema = createInsertSchema(kanbanBoardShares).omit({
  id: true,
  createdAt: true,
});

export const insertUserKanbanPreferenceSchema = createInsertSchema(userKanbanPreferences).omit({
  id: true,
  createdAt: true,
});

export const insertKanbanCardCommentSchema = createInsertSchema(kanbanCardComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertKanbanCardAttachmentSchema = createInsertSchema(kanbanCardAttachments).omit({
  id: true,
  createdAt: true,
});
