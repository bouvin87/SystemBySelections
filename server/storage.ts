import { 
  tenants, users, workTasks, workStations, shifts, departments, categories, questions, checklists, 
  checklistWorkTasks, checklistResponses, adminSettings, questionWorkTasks,
  deviationTypes, deviationPriorities, deviationStatuses, deviations, deviationComments, deviationLogs, deviationSettings, deviationAttachments,
  systemAnnouncements, customFields, customFieldTypeMappings, customFieldValues,
  roles, userHasRoles, userHasDepartments,
  kanbanBoards, kanbanColumns, kanbanCards, kanbanBoardShares, userKanbanPreferences,
  type Tenant, type InsertTenant, type User, type InsertUser,
  type WorkTask, type InsertWorkTask, type WorkStation, type InsertWorkStation,
  type Shift, type InsertShift, type Department, type InsertDepartment, type Category, type InsertCategory,
  type Question, type InsertQuestion, type Checklist, type InsertChecklist,
  type ChecklistWorkTask, type InsertChecklistWorkTask,
  type ChecklistResponse, type InsertChecklistResponse,
  type AdminSetting, type InsertAdminSetting,
  type QuestionWorkTask, type InsertQuestionWorkTask,
  type DeviationType, type InsertDeviationType,
  type DeviationPriority, type InsertDeviationPriority,
  type DeviationStatus, type InsertDeviationStatus,
  type Deviation, type InsertDeviation,
  type DeviationComment, type InsertDeviationComment,
  type DeviationLog, type InsertDeviationLog,
  type DeviationSetting, type InsertDeviationSetting,
  type DeviationAttachment, type InsertDeviationAttachment,
  type SystemAnnouncement, type InsertSystemAnnouncement,
  type CustomField, type InsertCustomField,
  type CustomFieldTypeMapping, type InsertCustomFieldTypeMapping,
  type CustomFieldValue, type InsertCustomFieldValue,
  type Role, type InsertRole,
  type UserHasRole, type InsertUserHasRole,
  type UserHasDepartment, type InsertUserHasDepartment,
  type KanbanBoard, type InsertKanbanBoard,
  type KanbanColumn, type InsertKanbanColumn,
  type KanbanCard, type InsertKanbanCard,
  type KanbanBoardShare, type InsertKanbanBoardShare,
  type UserKanbanPreference, type InsertUserKanbanPreference,
  KanbanBoardWithOwner
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, count, or, ilike, asc, isNotNull, lt, ne } from "drizzle-orm";

export interface IStorage {
  // === MULTI-TENANT CORE ===
  // Tenants
  getTenants(): Promise<Tenant[]>;
  getTenant(id: number): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: number, tenant: Partial<InsertTenant>): Promise<Tenant>;
  deleteTenant(id: number): Promise<void>;

  // Users  
  getAllUsers(): Promise<User[]>;
  getUsers(tenantId: number): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string, tenantId: number): Promise<User | undefined>;
  getUserByEmailGlobal(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;

  // === ROLE MANAGEMENT ===
  // Roles (tenant-scoped)
  getRoles(tenantId: number): Promise<Role[]>;
  getRole(id: string, tenantId: number): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: string, role: Partial<InsertRole>, tenantId: number): Promise<Role>;
  deleteRole(id: string, tenantId: number): Promise<void>;

  // User-Role relationships (tenant-scoped)
  getUserRoles(userId: number, tenantId: number): Promise<UserHasRole[]>;
  getRoleUsers(roleId: string, tenantId: number): Promise<UserHasRole[]>;
  getUserHasRole(id: string): Promise<UserHasRole | undefined>;
  assignRoleToUser(userRole: InsertUserHasRole): Promise<UserHasRole>;
  removeRoleFromUser(id: string): Promise<void>;

  // User-Department relationships (tenant-scoped)
  getUserDepartments(userId: number, tenantId: number): Promise<UserHasDepartment[]>;
  getDepartmentUsers(departmentId: number, tenantId: number): Promise<UserHasDepartment[]>;
  getUserHasDepartment(id: string): Promise<UserHasDepartment | undefined>;
  assignDepartmentToUser(userDepartment: InsertUserHasDepartment): Promise<UserHasDepartment>;
  removeDepartmentFromUser(id: string): Promise<void>;

  // === MODULE: CHECKLISTS ===
  // Work Tasks (tenant-scoped)
  getWorkTasks(tenantId: number): Promise<WorkTask[]>;
  getWorkTask(id: number, tenantId: number): Promise<WorkTask | undefined>;
  createWorkTask(workTask: InsertWorkTask): Promise<WorkTask>;
  updateWorkTask(id: number, workTask: Partial<InsertWorkTask>, tenantId: number): Promise<WorkTask>;
  deleteWorkTask(id: number, tenantId: number): Promise<void>;

  // Work Stations (tenant-scoped)
  getWorkStations(tenantId: number, workTaskId?: number): Promise<WorkStation[]>;
  getWorkStation(id: number, tenantId: number): Promise<WorkStation | undefined>;
  createWorkStation(workStation: InsertWorkStation): Promise<WorkStation>;
  updateWorkStation(id: number, workStation: Partial<InsertWorkStation>, tenantId: number): Promise<WorkStation>;
  deleteWorkStation(id: number, tenantId: number): Promise<void>;

  // Shifts (tenant-scoped)
  getShifts(tenantId: number): Promise<Shift[]>;
  getShift(id: number, tenantId: number): Promise<Shift | undefined>;
  createShift(shift: InsertShift): Promise<Shift>;
  updateShift(id: number, shift: Partial<InsertShift>, tenantId: number): Promise<Shift>;
  deleteShift(id: number, tenantId: number): Promise<void>;

  // Departments (tenant-scoped)
  getDepartments(tenantId: number): Promise<Department[]>;
  getDepartment(id: number, tenantId: number): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<InsertDepartment>, tenantId: number): Promise<Department>;
  deleteDepartment(id: number, tenantId: number): Promise<void>;

  // Departments (tenant-scoped)
  getDepartments(tenantId: number): Promise<Department[]>;
  getDepartment(id: number, tenantId: number): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<InsertDepartment>, tenantId: number): Promise<Department>;
  deleteDepartment(id: number, tenantId: number): Promise<void>;

  // Categories (tenant-scoped, belonging to checklists)
  getCategories(checklistId: string, tenantId: number): Promise<Category[]>;
  getCategory(id: number, tenantId: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>, tenantId: number): Promise<Category>;
  deleteCategory(id: number, tenantId: number): Promise<void>;

  // Questions (tenant-scoped, belonging to categories)
  getQuestions(categoryId: number, tenantId: number): Promise<Question[]>;
  getQuestion(id: number, tenantId: number): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: number, question: Partial<InsertQuestion>, tenantId: number): Promise<Question>;
  deleteQuestion(id: number, tenantId: number): Promise<void>;

  // Question Work Tasks (many-to-many relation)
  getQuestionWorkTasks(questionId: number, tenantId: number): Promise<QuestionWorkTask[]>;
  createQuestionWorkTask(questionWorkTask: InsertQuestionWorkTask): Promise<QuestionWorkTask>;
  deleteQuestionWorkTask(questionId: number, workTaskId: number, tenantId: number): Promise<void>;
  deleteAllQuestionWorkTasks(questionId: number, tenantId: number): Promise<void>;

  // Checklists (tenant-scoped)
  getChecklists(tenantId: number): Promise<Checklist[]>;
  getActiveChecklists(tenantId: number): Promise<Checklist[]>;
  getAllActiveChecklists(tenantId: number): Promise<Checklist[]>;
  getChecklist(id: string, tenantId: number): Promise<Checklist | undefined>;
  createChecklist(checklist: InsertChecklist): Promise<Checklist>;
  updateChecklist(id: string, checklist: Partial<InsertChecklist>, tenantId: number): Promise<Checklist>;
  deleteChecklist(id: string, tenantId: number): Promise<void>;

  // Checklist Work Tasks (tenant-scoped)
  getChecklistWorkTasks(checklistId: string, tenantId: number): Promise<ChecklistWorkTask[]>;
  createChecklistWorkTask(checklistWorkTask: InsertChecklistWorkTask): Promise<ChecklistWorkTask>;
  deleteChecklistWorkTask(checklistId: string, workTaskId: number, tenantId: number): Promise<void>;

  // Checklist Responses (tenant-scoped)
  getChecklistResponses(tenantId: number, filters?: { 
    limit?: number; 
    offset?: number; 
    checklistId?: string;
    workTaskId?: number;
    workStationId?: number;
    shiftId?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<ChecklistResponse[]>;
  getChecklistResponse(id: number, tenantId: number): Promise<ChecklistResponse | undefined>;
  createChecklistResponse(response: InsertChecklistResponse): Promise<ChecklistResponse>;
  updateChecklistResponse(id: number, response: Partial<InsertChecklistResponse>, tenantId: number): Promise<ChecklistResponse>;
  deleteChecklistResponse(id: number, tenantId: number): Promise<void>;

  // Dashboard Statistics (tenant-scoped)
  getDashboardStats(tenantId: number, filters?: { 
    checklistId?: string;
    workTaskId?: number;
    workStationId?: number;
    shiftId?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<any>;

  // Dashboard Questions (tenant-scoped)
  getDashboardQuestions(checklistId: string, tenantId: number): Promise<Question[]>;

  // Question Work Tasks (tenant-scoped)
  getQuestionWorkTasks(questionId: number, tenantId: number): Promise<QuestionWorkTask[]>;
  createQuestionWorkTask(questionWorkTask: InsertQuestionWorkTask): Promise<QuestionWorkTask>;
  deleteQuestionWorkTask(questionId: number, workTaskId: number, tenantId: number): Promise<void>;



  // Admin Settings (tenant-scoped)
  getAdminSettings(tenantId: number): Promise<AdminSetting[]>;
  getAdminSetting(key: string, tenantId: number): Promise<AdminSetting | undefined>;
  setAdminSetting(setting: InsertAdminSetting): Promise<AdminSetting>;

  // === DEVIATIONS MODULE ===
  getDeviationTypes(tenantId: number): Promise<DeviationType[]>;
  getDeviationType(id: number, tenantId: number): Promise<DeviationType | undefined>;
  createDeviationType(deviationType: InsertDeviationType): Promise<DeviationType>;
  updateDeviationType(id: number, deviationType: Partial<InsertDeviationType>, tenantId: number): Promise<DeviationType>;
  deleteDeviationType(id: number, tenantId: number): Promise<void>;

  // Deviation Priorities (tenant-scoped)
  getDeviationPriorities(tenantId: number): Promise<DeviationPriority[]>;
  getDeviationPriority(id: number, tenantId: number): Promise<DeviationPriority | undefined>;
  createDeviationPriority(priority: InsertDeviationPriority): Promise<DeviationPriority>;
  updateDeviationPriority(id: number, priority: Partial<InsertDeviationPriority>, tenantId: number): Promise<DeviationPriority>;
  deleteDeviationPriority(id: number, tenantId: number): Promise<void>;

  // Deviation Statuses (tenant-scoped)
  getDeviationStatuses(tenantId: number): Promise<DeviationStatus[]>;
  getDeviationStatus(id: number, tenantId: number): Promise<DeviationStatus | undefined>;
  createDeviationStatus(status: InsertDeviationStatus): Promise<DeviationStatus>;
  updateDeviationStatus(id: number, status: Partial<InsertDeviationStatus>, tenantId: number): Promise<DeviationStatus>;
  deleteDeviationStatus(id: number, tenantId: number): Promise<void>;
  getDeviations(tenantId: number, filters?: {
    status?: string;
    priority?: string;
    assignedToUserId?: number;
    createdByUserId?: number;
    workTaskId?: number;
    locationId?: number;
    deviationTypeId?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Deviation[]>;
  getDeviation(id: number, tenantId: number): Promise<Deviation | undefined>;
  createDeviation(deviation: InsertDeviation): Promise<Deviation>;
  updateDeviation(id: number, deviation: Partial<InsertDeviation>, tenantId: number, userId?: number): Promise<Deviation>;
  deleteDeviation(id: number, tenantId: number): Promise<void>;
  getDeviationComments(deviationId: number, tenantId: number): Promise<DeviationComment[]>;
  createDeviationComment(comment: InsertDeviationComment): Promise<DeviationComment>;
  deleteDeviationComment(id: number, tenantId: number): Promise<void>;
  getDeviationStats(tenantId: number): Promise<{
    total: number;
    new: number;
    inProgress: number;
    done: number;
    overdue: number;
    highPriority: number;
  }>;
  
  // Deviation Attachments
  getDeviationAttachments(deviationId: number, tenantId: number): Promise<DeviationAttachment[]>;
  createDeviationAttachment(attachment: InsertDeviationAttachment): Promise<DeviationAttachment>;
  deleteDeviationAttachment(id: number, tenantId: number): Promise<void>;

  // === KANBAN MODULE ===
  // Kanban Boards (tenant-scoped)
  getKanbanBoards(tenantId: number, userId?: number): Promise<KanbanBoard[]>;
  getKanbanBoard(id: string, tenantId: number, userId?: number): Promise<KanbanBoard | undefined>;
  createKanbanBoard(board: InsertKanbanBoard): Promise<KanbanBoard>;
  updateKanbanBoard(id: string, board: Partial<InsertKanbanBoard>, tenantId: number): Promise<KanbanBoard>;
  deleteKanbanBoard(id: string, tenantId: number): Promise<void>;

  // Kanban Columns (tenant-scoped through board)
  getKanbanColumns(boardId: string, tenantId: number, userId?: number): Promise<KanbanColumn[]>;
  getKanbanColumn(id: string, tenantId: number): Promise<KanbanColumn | undefined>;
  createKanbanColumn(column: InsertKanbanColumn): Promise<KanbanColumn>;
  updateKanbanColumn(id: string, column: Partial<InsertKanbanColumn>, tenantId: number): Promise<KanbanColumn>;
  deleteKanbanColumn(id: string, tenantId: number): Promise<void>;
  reorderKanbanColumns(boardId: string, columnOrders: { id: string; position: number }[], tenantId: number): Promise<void>;

  // Kanban Cards (tenant-scoped through column/board)
  getKanbanCardsByBoard(boardId: string, tenantId: number, userId?: number): Promise<KanbanCard[]>;
  getKanbanCards(columnId: string, tenantId: number): Promise<KanbanCard[]>;
  getKanbanCard(id: string, tenantId: number): Promise<KanbanCard | undefined>;
  createKanbanCard(card: InsertKanbanCard): Promise<KanbanCard>;
  updateKanbanCard(id: string, card: Partial<InsertKanbanCard>, tenantId: number): Promise<KanbanCard>;
  deleteKanbanCard(id: string, tenantId: number): Promise<void>;
  moveKanbanCard(cardId: string, newColumnId: string, newPosition: number, tenantId: number): Promise<KanbanCard>;
  reorderKanbanCards(columnId: string, cardOrders: { id: string; position: number }[], tenantId: number): Promise<void>;

  // Kanban Board Sharing (tenant-scoped)
  getKanbanBoardShares(boardId: string, tenantId: number): Promise<KanbanBoardShare[]>;
  createKanbanBoardShare(share: InsertKanbanBoardShare): Promise<KanbanBoardShare>;
  deleteKanbanBoardShare(id: string, tenantId: number): Promise<void>;

  // User Kanban Preferences
  getUserKanbanPreferences(userId: number): Promise<UserKanbanPreference[]>;
  getUserKanbanPreference(userId: number, boardId: string): Promise<UserKanbanPreference | undefined>;
  setUserKanbanPreference(preference: InsertUserKanbanPreference): Promise<UserKanbanPreference>;
  updateUserKanbanPreference(userId: number, boardId: string, updates: Partial<InsertUserKanbanPreference>): Promise<UserKanbanPreference>;
  deleteUserKanbanPreference(userId: number, boardId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // === MULTI-TENANT CORE IMPLEMENTATION ===
  
  // Tenants
  async getTenants(): Promise<Tenant[]> {
    return await db.select().from(tenants);
  }

  async getTenant(id: number): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant || undefined;
  }



  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    const [created] = await db.insert(tenants).values([tenant]).returning();
    return created;
  }

  async updateTenant(id: number, tenant: Partial<InsertTenant>): Promise<Tenant> {
    const [updated] = await db.update(tenants).set(tenant).where(eq(tenants.id, id)).returning();
    return updated;
  }

  async deleteTenant(id: number): Promise<void> {
    await db.delete(tenants).where(eq(tenants.id, id));
  }

  // Users
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUsers(tenantId: number): Promise<User[]> {
    const usersData = await db.select().from(users).where(eq(users.tenantId, tenantId));
    
    // Fetch roles and departments for each user
    const usersWithRelations = await Promise.all(
      usersData.map(async (user) => {
        const userRoles = await this.getUserRoles(user.id, tenantId);
        const userDepartments = await this.getUserDepartments(user.id, tenantId);

        return {
          ...user,
          roles: userRoles,
          departments: userDepartments
        };
      })
    );
    
    return usersWithRelations;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string, tenantId: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      and(eq(users.email, email), eq(users.tenantId, tenantId))
    );
    return user || undefined;
  }

  async getUserByEmailGlobal(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUsersByEmail(email: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.email, email));
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User> {
    const [updated] = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return updated;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // === MODULE: CHECKLISTS IMPLEMENTATION ===

  // Work Tasks
  async getWorkTasks(tenantId: number): Promise<WorkTask[]> {
    return await db.select().from(workTasks).where(eq(workTasks.tenantId, tenantId));
  }

  async getWorkTask(id: number, tenantId: number): Promise<WorkTask | undefined> {
    const [workTask] = await db.select().from(workTasks).where(
      and(eq(workTasks.id, id), eq(workTasks.tenantId, tenantId))
    );
    return workTask || undefined;
  }

  async createWorkTask(workTask: InsertWorkTask): Promise<WorkTask> {
    const [created] = await db.insert(workTasks).values([workTask]).returning();
    return created;
  }

  async updateWorkTask(id: number, workTask: Partial<InsertWorkTask>, tenantId: number): Promise<WorkTask> {
    const [updated] = await db.update(workTasks)
      .set(workTask)
      .where(and(eq(workTasks.id, id), eq(workTasks.tenantId, tenantId)))
      .returning();
    return updated;
  }

  async deleteWorkTask(id: number, tenantId: number): Promise<void> {
    await db.delete(workTasks).where(and(eq(workTasks.id, id), eq(workTasks.tenantId, tenantId)));
  }

  // Work Stations
  async getWorkStations(tenantId: number, workTaskId?: number): Promise<WorkStation[]> {
    let query = db.select().from(workStations).where(eq(workStations.tenantId, tenantId));
    
    if (workTaskId) {
      query = query.where(and(eq(workStations.tenantId, tenantId), eq(workStations.workTaskId, workTaskId)));
    }
    
    return await query;
  }

  async getWorkStation(id: number, tenantId: number): Promise<WorkStation | undefined> {
    const [workStation] = await db.select().from(workStations).where(
      and(eq(workStations.id, id), eq(workStations.tenantId, tenantId))
    );
    return workStation || undefined;
  }

  async createWorkStation(workStation: InsertWorkStation): Promise<WorkStation> {
    const [created] = await db.insert(workStations).values(workStation).returning();
    return created;
  }

  async updateWorkStation(id: number, workStation: Partial<InsertWorkStation>, tenantId: number): Promise<WorkStation> {
    const [updated] = await db.update(workStations)
      .set(workStation)
      .where(and(eq(workStations.id, id), eq(workStations.tenantId, tenantId)))
      .returning();
    return updated;
  }

  async deleteWorkStation(id: number, tenantId: number): Promise<void> {
    await db.delete(workStations).where(and(eq(workStations.id, id), eq(workStations.tenantId, tenantId)));
  }

  // Shifts
  async getShifts(tenantId: number): Promise<Shift[]> {
    return await db.select().from(shifts)
      .where(and(eq(shifts.tenantId, tenantId), eq(shifts.isActive, true)))
      .orderBy(shifts.order);
  }

  async getShift(id: number, tenantId: number): Promise<Shift | undefined> {
    const [shift] = await db.select().from(shifts).where(
      and(eq(shifts.id, id), eq(shifts.tenantId, tenantId))
    );
    return shift || undefined;
  }

  async createShift(shift: InsertShift): Promise<Shift> {
    const [created] = await db.insert(shifts).values(shift).returning();
    return created;
  }

  async updateShift(id: number, shift: Partial<InsertShift>, tenantId: number): Promise<Shift> {
    const [updated] = await db.update(shifts)
      .set(shift)
      .where(and(eq(shifts.id, id), eq(shifts.tenantId, tenantId)))
      .returning();
    return updated;
  }

  async deleteShift(id: number, tenantId: number): Promise<void> {
    await db.delete(shifts).where(and(eq(shifts.id, id), eq(shifts.tenantId, tenantId)));
  }

  // Departments
  async getDepartments(tenantId: number): Promise<Department[]> {
    return await db.select().from(departments).where(eq(departments.tenantId, tenantId)).orderBy(departments.order, departments.name);
  }

  async getDepartment(id: number, tenantId: number): Promise<Department | undefined> {
    const result = await db.select().from(departments).where(and(eq(departments.id, id), eq(departments.tenantId, tenantId)));
    return result[0];
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const result = await db.insert(departments).values(department).returning();
    return result[0];
  }

  async updateDepartment(id: number, department: Partial<InsertDepartment>, tenantId: number): Promise<Department> {
    const result = await db.update(departments)
      .set(department)
      .where(and(eq(departments.id, id), eq(departments.tenantId, tenantId)))
      .returning();
    return result[0];
  }

  async deleteDepartment(id: number, tenantId: number): Promise<void> {
    await db.delete(departments).where(and(eq(departments.id, id), eq(departments.tenantId, tenantId)));
  }

  // Departments
  async getDepartments(tenantId: number): Promise<Department[]> {
    return await db.select().from(departments).where(eq(departments.tenantId, tenantId)).orderBy(departments.order, departments.name);
  }

  async getDepartment(id: number, tenantId: number): Promise<Department | undefined> {
    const result = await db.select().from(departments).where(and(eq(departments.id, id), eq(departments.tenantId, tenantId)));
    return result[0];
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const result = await db.insert(departments).values(department).returning();
    return result[0];
  }

  async updateDepartment(id: number, department: Partial<InsertDepartment>, tenantId: number): Promise<Department> {
    const result = await db.update(departments)
      .set(department)
      .where(and(eq(departments.id, id), eq(departments.tenantId, tenantId)))
      .returning();
    return result[0];
  }

  async deleteDepartment(id: number, tenantId: number): Promise<void> {
    await db.delete(departments).where(and(eq(departments.id, id), eq(departments.tenantId, tenantId)));
  }

  // Categories
  async getCategories(checklistId: string, tenantId: number): Promise<Category[]> {
    return await db.select().from(categories).where(
      and(
        eq(categories.checklistId, checklistId),
        eq(categories.tenantId, tenantId),
        eq(categories.isActive, true)
      )
    ).orderBy(categories.order);
  }

  async getCategory(id: number, tenantId: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(
      and(eq(categories.id, id), eq(categories.tenantId, tenantId))
    );
    return category || undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>, tenantId: number): Promise<Category> {
    const [updated] = await db.update(categories)
      .set(category)
      .where(and(eq(categories.id, id), eq(categories.tenantId, tenantId)))
      .returning();
    return updated;
  }

  async deleteCategory(id: number, tenantId: number): Promise<void> {
    // First delete all questions that belong to this category
    await db.delete(questions).where(and(eq(questions.categoryId, id), eq(questions.tenantId, tenantId)));
    // Then delete the category
    await db.delete(categories).where(and(eq(categories.id, id), eq(categories.tenantId, tenantId)));
  }

  // Questions
  async getQuestions(categoryId: number, tenantId: number): Promise<Question[]> {
    return await db.select().from(questions).where(
      and(eq(questions.categoryId, categoryId), eq(questions.tenantId, tenantId))
    ).orderBy(questions.order);
  }

  async getQuestion(id: number, tenantId: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(
      and(eq(questions.id, id), eq(questions.tenantId, tenantId))
    );
    return question || undefined;
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [created] = await db.insert(questions).values(question).returning();
    return created;
  }

  async updateQuestion(id: number, question: Partial<InsertQuestion>, tenantId: number): Promise<Question> {
    const [updated] = await db.update(questions)
      .set(question)
      .where(and(eq(questions.id, id), eq(questions.tenantId, tenantId)))
      .returning();
    return updated;
  }

  async deleteQuestion(id: number, tenantId: number): Promise<void> {
    // First delete all question work task relations
    await db.delete(questionWorkTasks).where(and(eq(questionWorkTasks.questionId, id), eq(questionWorkTasks.tenantId, tenantId)));
    // Then delete the question
    await db.delete(questions).where(and(eq(questions.id, id), eq(questions.tenantId, tenantId)));
  }

  // Question Work Tasks
  async getQuestionWorkTasks(questionId: number, tenantId: number): Promise<QuestionWorkTask[]> {
    return await db.select().from(questionWorkTasks).where(
      and(eq(questionWorkTasks.questionId, questionId), eq(questionWorkTasks.tenantId, tenantId))
    );
  }

  async createQuestionWorkTask(questionWorkTask: InsertQuestionWorkTask): Promise<QuestionWorkTask> {
    const [created] = await db.insert(questionWorkTasks).values(questionWorkTask).returning();
    return created;
  }

  async deleteQuestionWorkTask(questionId: number, workTaskId: number, tenantId: number): Promise<void> {
    await db.delete(questionWorkTasks).where(
      and(
        eq(questionWorkTasks.questionId, questionId),
        eq(questionWorkTasks.workTaskId, workTaskId),
        eq(questionWorkTasks.tenantId, tenantId)
      )
    );
  }

  async deleteAllQuestionWorkTasks(questionId: number, tenantId: number): Promise<void> {
    await db.delete(questionWorkTasks).where(
      and(eq(questionWorkTasks.questionId, questionId), eq(questionWorkTasks.tenantId, tenantId))
    );
  }

  // Checklists
  async getChecklists(tenantId: number): Promise<Checklist[]> {
    return await db.select().from(checklists)
      .where(eq(checklists.tenantId, tenantId))
      .orderBy(checklists.order);
  }

  async getActiveChecklists(tenantId: number): Promise<Checklist[]> {
    return await db.select().from(checklists).where(
      and(eq(checklists.tenantId, tenantId), eq(checklists.isActive, true))
    ).orderBy(checklists.order);
  }

  async getAllActiveChecklists(tenantId: number): Promise<Checklist[]> {
    return await db.select().from(checklists).where(
      and(eq(checklists.tenantId, tenantId), eq(checklists.isActive, true))
    ).orderBy(checklists.order);
  }

  async getChecklist(id: string, tenantId: number): Promise<Checklist | undefined> {
    const [checklist] = await db.select().from(checklists).where(
      and(eq(checklists.id, id), eq(checklists.tenantId, tenantId))
    );
    return checklist || undefined;
  }

  async createChecklist(checklist: InsertChecklist): Promise<Checklist> {
    const [created] = await db.insert(checklists).values(checklist).returning();
    return created;
  }

  async updateChecklist(id: string, checklist: Partial<InsertChecklist>, tenantId: number): Promise<Checklist> {
    const [updated] = await db.update(checklists)
      .set(checklist)
      .where(and(eq(checklists.id, id), eq(checklists.tenantId, tenantId)))
      .returning();
    return updated;
  }

  async deleteChecklist(id: string, tenantId: number): Promise<void> {
    await db.delete(checklists).where(and(eq(checklists.id, id), eq(checklists.tenantId, tenantId)));
  }

  // Checklist Work Tasks
  async getChecklistWorkTasks(checklistId: string, tenantId: number): Promise<ChecklistWorkTask[]> {
    return await db.select().from(checklistWorkTasks).where(
      and(eq(checklistWorkTasks.checklistId, checklistId), eq(checklistWorkTasks.tenantId, tenantId))
    );
  }

  async createChecklistWorkTask(checklistWorkTask: InsertChecklistWorkTask): Promise<ChecklistWorkTask> {
    const [created] = await db.insert(checklistWorkTasks).values(checklistWorkTask).returning();
    return created;
  }

  async deleteChecklistWorkTask(checklistId: string, workTaskId: number, tenantId: number): Promise<void> {
    await db.delete(checklistWorkTasks).where(
      and(
        eq(checklistWorkTasks.checklistId, checklistId),
        eq(checklistWorkTasks.workTaskId, workTaskId),
        eq(checklistWorkTasks.tenantId, tenantId)
      )
    );
  }

  async deleteAllChecklistWorkTasks(checklistId: string, tenantId: number): Promise<void> {
    await db.delete(checklistWorkTasks).where(
      and(
        eq(checklistWorkTasks.checklistId, checklistId),
        eq(checklistWorkTasks.tenantId, tenantId)
      )
    );
  }

  // Checklist Responses
  async getChecklistResponses(tenantId: number, filters: { 
    limit?: number; 
    offset?: number; 
    checklistId?: string;
    workTaskId?: number;
    workStationId?: number;
    shiftId?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
  } = {}): Promise<ChecklistResponse[]> {
    const { limit = 50, offset = 0, checklistId, workTaskId, workStationId, shiftId, startDate, endDate, search } = filters;
    
    const conditions = [eq(checklistResponses.tenantId, tenantId)];

    if (checklistId) {
      conditions.push(eq(checklistResponses.checklistId, checklistId));
    }
    if (workTaskId) {
      conditions.push(eq(checklistResponses.workTaskId, workTaskId));
    }
    if (workStationId) {
      conditions.push(eq(checklistResponses.workStationId, workStationId));
    }
    if (shiftId) {
      conditions.push(eq(checklistResponses.shiftId, shiftId));
    }
    if (search) {
      conditions.push(sql`${checklistResponses.operatorName} ILIKE ${`%${search}%`}`);
    }
    if (startDate) {
      conditions.push(sql`DATE(${checklistResponses.createdAt}) >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql`DATE(${checklistResponses.createdAt}) <= ${endDate}`);
    }

    return await db.select().from(checklistResponses)
      .where(and(...conditions))
      .orderBy(desc(checklistResponses.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getChecklistResponse(id: number, tenantId: number): Promise<ChecklistResponse | undefined> {
    const [response] = await db.select().from(checklistResponses).where(
      and(eq(checklistResponses.id, id), eq(checklistResponses.tenantId, tenantId))
    );
    return response || undefined;
  }

  async createChecklistResponse(response: InsertChecklistResponse): Promise<ChecklistResponse> {
    const [created] = await db.insert(checklistResponses).values(response).returning();
    return created;
  }

  async updateChecklistResponse(id: number, response: Partial<InsertChecklistResponse>, tenantId: number): Promise<ChecklistResponse> {
    const [updated] = await db.update(checklistResponses)
      .set(response)
      .where(and(eq(checklistResponses.id, id), eq(checklistResponses.tenantId, tenantId)))
      .returning();
    return updated;
  }

  async deleteChecklistResponse(id: number, tenantId: number): Promise<void> {
    await db.delete(checklistResponses).where(
      and(eq(checklistResponses.id, id), eq(checklistResponses.tenantId, tenantId))
    );
  }

  // Dashboard Statistics
  async getDashboardStats(tenantId: number, filters: {
    checklistId?: string;
    workTaskId?: number;
    workStationId?: number;
    shiftId?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
  } = {}): Promise<any> {
    const { checklistId, workTaskId, workStationId, shiftId, startDate, endDate, search } = filters;
    const conditions = [eq(checklistResponses.tenantId, tenantId)];
    
    if (checklistId) {
      conditions.push(eq(checklistResponses.checklistId, checklistId));
    }
    
    if (workTaskId) {
      conditions.push(eq(checklistResponses.workTaskId, workTaskId));
    }
    
    if (workStationId) {
      conditions.push(eq(checklistResponses.workStationId, workStationId));
    }
    
    if (shiftId) {
      conditions.push(eq(checklistResponses.shiftId, shiftId));
    }
    
    if (search) {
      conditions.push(sql`${checklistResponses.operatorName} ILIKE ${`%${search}%`}`);
    }
    
    if (startDate) {
      conditions.push(sql`DATE(${checklistResponses.createdAt}) >= ${startDate}`);
    }
    
    if (endDate) {
      conditions.push(sql`DATE(${checklistResponses.createdAt}) <= ${endDate}`);
    }

    const whereCondition = and(...conditions);
    
    const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(checklistResponses)
      .where(whereCondition);
    
    const recentResponses = await db.select().from(checklistResponses)
      .where(whereCondition)
      .orderBy(desc(checklistResponses.createdAt))
      .limit(10);

    return {
      totalResponses: totalResult?.count || 0,
      recentResponses,
    };
  }

  // Dashboard Questions
  async getDashboardQuestions(checklistId: string, tenantId: number): Promise<Question[]> {
    const result = await db.select({
      id: questions.id,
      tenantId: questions.tenantId,
      categoryId: questions.categoryId,
      text: questions.text,
      type: questions.type,
      options: questions.options,
      validation: questions.validation,
      showInDashboard: questions.showInDashboard,
      dashboardDisplayType: questions.dashboardDisplayType,
      hideInView: questions.hideInView,
      order: questions.order,
      isRequired: questions.isRequired
    }).from(questions)
      .innerJoin(categories, eq(questions.categoryId, categories.id))
      .where(
        and(
          eq(categories.checklistId, checklistId),
          eq(categories.tenantId, tenantId),
          eq(questions.tenantId, tenantId),
          eq(questions.showInDashboard, true)
        )
      )
      .orderBy(questions.order);
    
    // Set default dashboardDisplayType to 'average' if null
    return result.map(question => ({
      ...question,
      dashboardDisplayType: question.dashboardDisplayType || 'average'
    }));
  }

  // Admin Settings
  async getAdminSettings(tenantId: number): Promise<AdminSetting[]> {
    return await db.select().from(adminSettings).where(eq(adminSettings.tenantId, tenantId));
  }

  async getAdminSetting(key: string, tenantId: number): Promise<AdminSetting | undefined> {
    const [setting] = await db.select().from(adminSettings).where(
      and(eq(adminSettings.key, key), eq(adminSettings.tenantId, tenantId))
    );
    return setting || undefined;
  }

  async setAdminSetting(setting: InsertAdminSetting): Promise<AdminSetting> {
    // Upsert logic - insert or update if exists
    const existing = await this.getAdminSetting(setting.key, setting.tenantId);
    
    if (existing) {
      const [updated] = await db.update(adminSettings)
        .set({ value: setting.value })
        .where(and(eq(adminSettings.key, setting.key), eq(adminSettings.tenantId, setting.tenantId)))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(adminSettings).values(setting).returning();
      return created;
    }
  }

  // === DEVIATIONS MODULE IMPLEMENTATION ===
  
  async getDeviationTypes(tenantId: number): Promise<DeviationType[]> {
    return await db.select().from(deviationTypes).where(eq(deviationTypes.tenantId, tenantId));
  }

  async getDeviationType(id: number, tenantId: number): Promise<DeviationType | undefined> {
    const result = await db.select().from(deviationTypes)
      .where(and(eq(deviationTypes.id, id), eq(deviationTypes.tenantId, tenantId)))
      .limit(1);
    return result[0];
  }

  async createDeviationType(deviationType: InsertDeviationType): Promise<DeviationType> {
    const result = await db.insert(deviationTypes).values(deviationType).returning();
    return result[0];
  }

  async updateDeviationType(id: number, deviationType: Partial<InsertDeviationType>, tenantId: number): Promise<DeviationType> {
    const result = await db.update(deviationTypes)
      .set({ ...deviationType, updatedAt: new Date() })
      .where(and(eq(deviationTypes.id, id), eq(deviationTypes.tenantId, tenantId)))
      .returning();
    
    if (result.length === 0) {
      throw new Error('Deviation type not found');
    }
    return result[0];
  }

  async deleteDeviationType(id: number, tenantId: number): Promise<void> {
    const result = await db.delete(deviationTypes)
      .where(and(eq(deviationTypes.id, id), eq(deviationTypes.tenantId, tenantId)))
      .returning();
    
    if (result.length === 0) {
      throw new Error('Deviation type not found');
    }
  }

  // Deviation Priorities
  async getDeviationPriorities(tenantId: number): Promise<DeviationPriority[]> {
    return await db.select().from(deviationPriorities).where(eq(deviationPriorities.tenantId, tenantId)).orderBy(deviationPriorities.order, deviationPriorities.name);
  }

  async getDeviationPriority(id: number, tenantId: number): Promise<DeviationPriority | undefined> {
    const result = await db.select().from(deviationPriorities).where(and(eq(deviationPriorities.id, id), eq(deviationPriorities.tenantId, tenantId)));
    return result[0];
  }

  async createDeviationPriority(priority: InsertDeviationPriority): Promise<DeviationPriority> {
    const result = await db.insert(deviationPriorities).values(priority).returning();
    return result[0];
  }

  async updateDeviationPriority(id: number, priority: Partial<InsertDeviationPriority>, tenantId: number): Promise<DeviationPriority> {
    const result = await db.update(deviationPriorities)
      .set({ ...priority, updatedAt: new Date() })
      .where(and(eq(deviationPriorities.id, id), eq(deviationPriorities.tenantId, tenantId)))
      .returning();
    return result[0];
  }

  async deleteDeviationPriority(id: number, tenantId: number): Promise<void> {
    await db.delete(deviationPriorities).where(and(eq(deviationPriorities.id, id), eq(deviationPriorities.tenantId, tenantId)));
  }

  // Deviation Statuses
  async getDeviationStatuses(tenantId: number): Promise<DeviationStatus[]> {
    return await db.select().from(deviationStatuses).where(eq(deviationStatuses.tenantId, tenantId)).orderBy(deviationStatuses.order, deviationStatuses.name);
  }

  async getDeviationStatusById(id: number, tenantId: number): Promise<DeviationStatus | null> {
    const result = await db.select().from(deviationStatuses).where(and(eq(deviationStatuses.id, id), eq(deviationStatuses.tenantId, tenantId)));
    return result[0] || null;
  }

  async getUserById(id: number): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0] || null;
  }

  async getDeviationTypeById(id: number, tenantId: number): Promise<DeviationType | null> {
    const result = await db.select().from(deviationTypes).where(and(eq(deviationTypes.id, id), eq(deviationTypes.tenantId, tenantId)));
    return result[0] || null;
  }

  async getDeviationStatus(id: number, tenantId: number): Promise<DeviationStatus | undefined> {
    const result = await db.select().from(deviationStatuses).where(and(eq(deviationStatuses.id, id), eq(deviationStatuses.tenantId, tenantId)));
    return result[0];
  }

  async createDeviationStatus(status: InsertDeviationStatus): Promise<DeviationStatus> {
    const result = await db.insert(deviationStatuses).values(status).returning();
    return result[0];
  }

  async updateDeviationStatus(id: number, status: Partial<InsertDeviationStatus>, tenantId: number): Promise<DeviationStatus> {
    const result = await db.update(deviationStatuses)
      .set({ ...status, updatedAt: new Date() })
      .where(and(eq(deviationStatuses.id, id), eq(deviationStatuses.tenantId, tenantId)))
      .returning();
    return result[0];
  }

  async deleteDeviationStatus(id: number, tenantId: number): Promise<void> {
    await db.delete(deviationStatuses).where(and(eq(deviationStatuses.id, id), eq(deviationStatuses.tenantId, tenantId)));
  }

  async getDefaultDeviationStatus(tenantId: number): Promise<DeviationStatus | undefined> {
    const result = await db.select().from(deviationStatuses)
      .where(and(eq(deviationStatuses.tenantId, tenantId), eq(deviationStatuses.isDefault, true)))
      .limit(1);
    return result[0];
  }

  async getDeviations(tenantId: number, filters?: {
    status?: string;
    priority?: string;
    assignedToUserId?: number;
    createdByUserId?: number;
    workTaskId?: number;
    locationId?: number;
    deviationTypeId?: number;
    search?: string;
    limit?: number;
    offset?: number;
    userId?: number; // Current user ID for hidden filtering
    userRole?: string; // Current user role for hidden filtering
    userDepartmentId?: number; // Current user department for manager access
  }): Promise<Deviation[]> {
    const conditions = [eq(deviations.tenantId, tenantId)];
    
    // Handle hidden deviations based on user role
    if (filters?.userId && filters?.userRole) {
      const isAdmin = filters.userRole === 'admin' || filters.userRole === 'superadmin';
      
      if (!isAdmin) {
        // Regular users and underadmins can only see:
        // 1. Non-hidden deviations, OR
        // 2. Hidden deviations they created, OR  
        // 3. Hidden deviations assigned to them, OR
        // 4. Hidden deviations in their department (if they're department manager)
        const hiddenConditions = [
          eq(deviations.isHidden, false), // Non-hidden
          and(eq(deviations.isHidden, true), eq(deviations.createdByUserId, filters.userId)), // Created by user
          and(eq(deviations.isHidden, true), eq(deviations.assignedToUserId, filters.userId)), // Assigned to user
        ];
        
        // Add department manager condition if user has department
        if (filters.userDepartmentId) {
          hiddenConditions.push(
            and(eq(deviations.isHidden, true), eq(deviations.departmentId, filters.userDepartmentId))
          );
        }
        
        conditions.push(or(...hiddenConditions));
      }
      // Admins and superadmins can see all deviations (no additional filtering)
    } else {
      // If no user context provided, only show non-hidden deviations
      conditions.push(eq(deviations.isHidden, false));
    }
    
    if (filters) {
      if (filters.status) {
        conditions.push(eq(deviations.statusId, parseInt(filters.status)));
      }
      if (filters.priority) {
        conditions.push(eq(deviations.priorityId, parseInt(filters.priority)));
      }
      if (filters.assignedToUserId) {
        conditions.push(eq(deviations.assignedToUserId, filters.assignedToUserId));
      }
      if (filters.createdByUserId) {
        conditions.push(eq(deviations.createdByUserId, filters.createdByUserId));
      }
      if (filters.workTaskId) {
        conditions.push(eq(deviations.workTaskId, filters.workTaskId));
      }
      if (filters.locationId) {
        conditions.push(eq(deviations.locationId, filters.locationId));
      }
      if (filters.deviationTypeId) {
        conditions.push(eq(deviations.deviationTypeId, filters.deviationTypeId));
      }
      if (filters.search) {
        conditions.push(or(
          ilike(deviations.title, `%${filters.search}%`),
          ilike(deviations.description, `%${filters.search}%`)
        ));
      }
    }

    let query = db.select().from(deviations)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .orderBy(desc(deviations.createdAt));

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    return await query;
  }

  async getDeviation(id: number, tenantId: number, userId?: number, userRole?: string, userDepartmentId?: number): Promise<Deviation | undefined> {
    const result = await db.select().from(deviations)
      .where(and(eq(deviations.id, id), eq(deviations.tenantId, tenantId)))
      .limit(1);
    
    const deviation = result[0];
    if (!deviation) return undefined;
    
    // Check if user can access this hidden deviation
    if (deviation.isHidden && userId && userRole) {
      const isAdmin = userRole === 'admin' || userRole === 'superadmin';
      const isCreator = deviation.createdByUserId === userId;
      const isAssigned = deviation.assignedToUserId === userId;
      const isDepartmentManager = userDepartmentId && deviation.departmentId === userDepartmentId;
      
      if (!isAdmin && !isCreator && !isAssigned && !isDepartmentManager) {
        return undefined; // User cannot access this hidden deviation
      }
    }
    
    return deviation;
  }

  async createDeviation(deviation: InsertDeviation): Promise<Deviation> {
    const result = await db.insert(deviations).values(deviation).returning();
    
    // Log the creation
    await this.logDeviationChange(
      result[0].id,
      deviation.createdByUserId,
      'created',
      undefined,
      undefined,
      undefined,
      'deviation_created'
    );
    
    return result[0];
  }

  async updateDeviation(id: number, deviation: Partial<InsertDeviation>, tenantId: number, userId?: number): Promise<Deviation> {
    // Get the old deviation for comparison
    const oldDeviation = await this.getDeviation(id, tenantId);
    if (!oldDeviation) {
      throw new Error('Deviation not found');
    }

    const result = await db.update(deviations)
      .set({ ...deviation, updatedAt: new Date() })
      .where(and(eq(deviations.id, id), eq(deviations.tenantId, tenantId)))
      .returning();
    
    if (result.length === 0) {
      throw new Error('Deviation not found');
    }

    // Log all changes if userId is provided
    if (userId) {
      const newDeviation = result[0];
      
      // Check each field for changes and log them
      if (deviation.title !== undefined && oldDeviation.title !== newDeviation.title) {
        await this.logDeviationChange(
          id, userId, 'field_changed', 'title', 
          oldDeviation.title, newDeviation.title, 
          'field_changed_title'
        );
      }
      
      if (deviation.description !== undefined && oldDeviation.description !== newDeviation.description) {
        await this.logDeviationChange(
          id, userId, 'field_changed', 'description', 
          oldDeviation.description || '', newDeviation.description || '', 
          'field_changed_description'
        );
      }
      
      if (deviation.statusId !== undefined && oldDeviation.statusId !== newDeviation.statusId) {
        await this.logDeviationChange(
          id, userId, 'field_changed', 'statusId', 
          oldDeviation.statusId?.toString(), newDeviation.statusId?.toString(), 
          'field_changed_status'
        );
      }
      
      if (deviation.priorityId !== undefined && oldDeviation.priorityId !== newDeviation.priorityId) {
        await this.logDeviationChange(
          id, userId, 'field_changed', 'priorityId', 
          oldDeviation.priorityId?.toString(), newDeviation.priorityId?.toString(), 
          'field_changed_priority'
        );
      }
      
      if (deviation.deviationTypeId !== undefined && oldDeviation.deviationTypeId !== newDeviation.deviationTypeId) {
        await this.logDeviationChange(
          id, userId, 'field_changed', 'deviationTypeId', 
          oldDeviation.deviationTypeId.toString(), newDeviation.deviationTypeId.toString(), 
          'field_changed_type'
        );
      }
      
      if (deviation.assignedToUserId !== undefined && oldDeviation.assignedToUserId !== newDeviation.assignedToUserId) {
        await this.logDeviationChange(
          id, userId, 'field_changed', 'assignedToUserId', 
          oldDeviation.assignedToUserId?.toString(), newDeviation.assignedToUserId?.toString(), 
          'field_changed_assignment'
        );
      }
      
      if (deviation.dueDate !== undefined) {
        const oldDueDateStr = oldDeviation.dueDate ? oldDeviation.dueDate.toISOString().split('T')[0] : null;
        const newDueDateStr = newDeviation.dueDate ? newDeviation.dueDate.toISOString().split('T')[0] : null;
        
        if (oldDueDateStr !== newDueDateStr) {
          await this.logDeviationChange(
            id, userId, 'field_changed', 'dueDate', 
            oldDueDateStr, newDueDateStr, 
            'field_changed_due_date'
          );
        }
      }
      
      if (deviation.workTaskId !== undefined && oldDeviation.workTaskId !== newDeviation.workTaskId) {
        await this.logDeviationChange(
          id, userId, 'field_changed', 'workTaskId', 
          oldDeviation.workTaskId?.toString(), newDeviation.workTaskId?.toString(), 
          'field_changed_work_task'
        );
      }
      
      if (deviation.locationId !== undefined && oldDeviation.locationId !== newDeviation.locationId) {
        await this.logDeviationChange(
          id, userId, 'field_changed', 'locationId', 
          oldDeviation.locationId?.toString(), newDeviation.locationId?.toString(), 
          'field_changed_location'
        );
      }
      
      if (deviation.departmentId !== undefined && oldDeviation.departmentId !== newDeviation.departmentId) {
        await this.logDeviationChange(
          id, userId, 'field_changed', 'departmentId', 
          oldDeviation.departmentId?.toString(), newDeviation.departmentId?.toString(), 
          'field_changed_department'
        );
      }
    }
    
    return result[0];
  }

  async deleteDeviation(id: number, tenantId: number): Promise<void> {
    const result = await db.delete(deviations)
      .where(and(eq(deviations.id, id), eq(deviations.tenantId, tenantId)))
      .returning();
    
    if (result.length === 0) {
      throw new Error('Deviation not found');
    }
  }

  async getDeviationComments(deviationId: number, tenantId: number): Promise<DeviationComment[]> {
    // First verify deviation exists and belongs to tenant
    const deviation = await this.getDeviation(deviationId, tenantId);
    if (!deviation) {
      throw new Error('Deviation not found');
    }

    return await db.select().from(deviationComments)
      .where(eq(deviationComments.deviationId, deviationId))
      .orderBy(desc(deviationComments.createdAt));
  }

  async createDeviationComment(comment: InsertDeviationComment): Promise<DeviationComment> {
    const result = await db.insert(deviationComments).values(comment).returning();
    return result[0];
  }

  async deleteDeviationComment(id: number, tenantId: number): Promise<void> {
    // First get the comment to verify it exists and get the deviation ID
    const comment = await db.select().from(deviationComments)
      .where(eq(deviationComments.id, id))
      .limit(1);
    
    if (comment.length === 0) {
      throw new Error('Comment not found');
    }

    // Verify the deviation belongs to the tenant
    const deviation = await this.getDeviation(comment[0].deviationId, tenantId);
    if (!deviation) {
      throw new Error('Deviation not found');
    }

    await db.delete(deviationComments).where(eq(deviationComments.id, id));
  }

  // === DEVIATION LOGS ===
  
  async getDeviationLogs(deviationId: number, tenantId: number): Promise<DeviationLog[]> {
    // First verify deviation exists and belongs to tenant
    const deviation = await this.getDeviation(deviationId, tenantId);
    if (!deviation) {
      throw new Error('Deviation not found');
    }

    return await db.select().from(deviationLogs)
      .where(eq(deviationLogs.deviationId, deviationId))
      .orderBy(desc(deviationLogs.createdAt));
  }

  async createDeviationLog(log: InsertDeviationLog): Promise<DeviationLog> {
    const result = await db.insert(deviationLogs).values(log).returning();
    return result[0];
  }

  // Helper method to log deviation changes
  async logDeviationChange(
    deviationId: number,
    userId: number,
    action: string,
    field?: string,
    oldValue?: string,
    newValue?: string,
    description?: string
  ): Promise<void> {
    await this.createDeviationLog({
      deviationId,
      userId,
      action,
      field,
      oldValue,
      newValue,
      description,
    });
  }

  async getDeviationStats(tenantId: number): Promise<{
    total: number;
    new: number;
    inProgress: number;
    done: number;
    overdue: number;
    highPriority: number;
  }> {
    const today = new Date();
    
    // Get status IDs for filtering
    const statuses = await this.getDeviationStatuses(tenantId);
    const newStatusId = statuses.find(s => s.name.toLowerCase() === 'ny')?.id;
    const inProgressStatusId = statuses.find(s => s.name.toLowerCase() === 'pågående')?.id;
    const doneStatusId = statuses.find(s => s.name.toLowerCase() === 'klar')?.id;
    
    // Get priority IDs for filtering
    const priorities = await this.getDeviationPriorities(tenantId);
    const highPriorityIds = priorities.filter(p => 
      p.name.toLowerCase().includes('hög') || 
      p.name.toLowerCase().includes('kritisk')
    ).map(p => p.id);
    
    const [totalResult] = await db.select({ count: count() }).from(deviations)
      .where(eq(deviations.tenantId, tenantId));
    
    const [newResult] = await db.select({ count: count() }).from(deviations)
      .where(and(eq(deviations.tenantId, tenantId), eq(deviations.statusId, newStatusId || 0)));
    
    const [inProgressResult] = await db.select({ count: count() }).from(deviations)
      .where(and(eq(deviations.tenantId, tenantId), eq(deviations.statusId, inProgressStatusId || 0)));
    
    const [doneResult] = await db.select({ count: count() }).from(deviations)
      .where(and(eq(deviations.tenantId, tenantId), eq(deviations.statusId, doneStatusId || 0)));
    
    const [overdueResult] = await db.select({ count: count() }).from(deviations)
      .where(and(
        eq(deviations.tenantId, tenantId),
        ne(deviations.statusId, doneStatusId || 0),
        isNotNull(deviations.dueDate),
        lt(deviations.dueDate, today)
      ));
    
    const highPriorityConditions = highPriorityIds.length > 0 
      ? highPriorityIds.map(id => eq(deviations.priorityId, id))
      : [eq(deviations.priorityId, 0)]; // fallback that returns 0 results
    
    const [highPriorityResult] = await db.select({ count: count() }).from(deviations)
      .where(and(
        eq(deviations.tenantId, tenantId),
        or(...highPriorityConditions)
      ));

    return {
      total: totalResult.count,
      new: newResult.count,
      inProgress: inProgressResult.count,
      done: doneResult.count,
      overdue: overdueResult.count,
      highPriority: highPriorityResult.count,
    };
  }

  // Deviation Settings
  async getDeviationSettings(tenantId: number): Promise<DeviationSetting | undefined> {
    const [setting] = await db.select().from(deviationSettings)
      .where(eq(deviationSettings.tenantId, tenantId))
      .limit(1);
    return setting;
  }

  async updateDeviationSettings(tenantId: number, settings: Partial<InsertDeviationSetting>): Promise<DeviationSetting> {
    const existingSettings = await this.getDeviationSettings(tenantId);
    
    if (existingSettings) {
      const [updated] = await db.update(deviationSettings)
        .set({ 
          ...settings,
          updatedAt: new Date()
        })
        .where(eq(deviationSettings.tenantId, tenantId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(deviationSettings)
        .values({
          tenantId,
          ...settings
        })
        .returning();
      return created;
    }
  }

  // === DEVIATION ATTACHMENTS ===
  async getDeviationAttachments(deviationId: number, tenantId: number): Promise<DeviationAttachment[]> {
    return await db
      .select()
      .from(deviationAttachments)
      .innerJoin(deviations, eq(deviationAttachments.deviationId, deviations.id))
      .where(and(
        eq(deviationAttachments.deviationId, deviationId),
        eq(deviations.tenantId, tenantId)
      ))
      .then(results => results.map(result => result.deviation_attachments));
  }

  async createDeviationAttachment(attachment: InsertDeviationAttachment): Promise<DeviationAttachment> {
    const [created] = await db.insert(deviationAttachments).values(attachment).returning();
    return created;
  }

  async deleteDeviationAttachment(id: number, tenantId: number): Promise<void> {
    await db
      .delete(deviationAttachments)
      .where(and(
        eq(deviationAttachments.id, id),
        sql`EXISTS (
          SELECT 1 FROM ${deviations} 
          WHERE ${deviations.id} = ${deviationAttachments.deviationId} 
          AND ${deviations.tenantId} = ${tenantId}
        )`
      ));
  }

  // === SYSTEM ANNOUNCEMENTS ===
  async getActiveSystemAnnouncement(): Promise<SystemAnnouncement | null> {
    const [announcement] = await db
      .select()
      .from(systemAnnouncements)
      .where(eq(systemAnnouncements.isActive, true))
      .orderBy(desc(systemAnnouncements.createdAt))
      .limit(1);

    return announcement || null;
  }

  async getSystemAnnouncements(): Promise<SystemAnnouncement[]> {
    const announcements = await db
      .select()
      .from(systemAnnouncements)
      .orderBy(desc(systemAnnouncements.createdAt));

    return announcements;
  }

  async createSystemAnnouncement(announcement: InsertSystemAnnouncement): Promise<SystemAnnouncement> {
    const [newAnnouncement] = await db
      .insert(systemAnnouncements)
      .values(announcement)
      .returning();

    return newAnnouncement;
  }

  async updateSystemAnnouncement(id: number, announcement: Partial<InsertSystemAnnouncement>): Promise<SystemAnnouncement> {
    const [updatedAnnouncement] = await db
      .update(systemAnnouncements)
      .set({
        ...announcement,
        updatedAt: new Date()
      })
      .where(eq(systemAnnouncements.id, id))
      .returning();

    return updatedAnnouncement;
  }

  async deleteSystemAnnouncement(id: number): Promise<void> {
    await db
      .delete(systemAnnouncements)
      .where(eq(systemAnnouncements.id, id));
  }

  // === CUSTOM FIELDS ===
  async getCustomFields(tenantId: number): Promise<CustomField[]> {
    return await db.select()
      .from(customFields)
      .where(eq(customFields.tenantId, tenantId))
      .orderBy(asc(customFields.order), asc(customFields.name));
  }

  async getCustomField(id: number, tenantId: number): Promise<CustomField | undefined> {
    const [field] = await db.select()
      .from(customFields)
      .where(and(eq(customFields.id, id), eq(customFields.tenantId, tenantId)));
    return field;
  }

  async createCustomField(field: InsertCustomField): Promise<CustomField> {
    const [created] = await db.insert(customFields).values(field).returning();
    return created;
  }

  async updateCustomField(id: number, field: Partial<InsertCustomField>, tenantId: number): Promise<CustomField> {
    const [updated] = await db.update(customFields)
      .set({ ...field, updatedAt: new Date() })
      .where(and(eq(customFields.id, id), eq(customFields.tenantId, tenantId)))
      .returning();
    return updated;
  }

  async deleteCustomField(id: number, tenantId: number): Promise<void> {
    await db.delete(customFields)
      .where(and(eq(customFields.id, id), eq(customFields.tenantId, tenantId)));
  }

  // === CUSTOM FIELD TYPE MAPPINGS ===
  async getCustomFieldsForDeviationType(deviationTypeId: number, tenantId: number): Promise<CustomField[]> {
    return await db.select({
      id: customFields.id,
      tenantId: customFields.tenantId,
      name: customFields.name,
      fieldType: customFields.fieldType,
      options: customFields.options,
      isRequired: customFields.isRequired,
      order: customFields.order,
      createdAt: customFields.createdAt,
      updatedAt: customFields.updatedAt,
    })
      .from(customFields)
      .innerJoin(customFieldTypeMappings, eq(customFields.id, customFieldTypeMappings.customFieldId))
      .where(and(
        eq(customFieldTypeMappings.deviationTypeId, deviationTypeId),
        eq(customFields.tenantId, tenantId)
      ))
      .orderBy(asc(customFields.order), asc(customFields.name));
  }

  async createCustomFieldTypeMapping(mapping: InsertCustomFieldTypeMapping): Promise<CustomFieldTypeMapping> {
    const [created] = await db.insert(customFieldTypeMappings).values(mapping).returning();
    return created;
  }

  async deleteCustomFieldTypeMapping(customFieldId: number, deviationTypeId: number): Promise<void> {
    await db.delete(customFieldTypeMappings)
      .where(and(
        eq(customFieldTypeMappings.customFieldId, customFieldId),
        eq(customFieldTypeMappings.deviationTypeId, deviationTypeId)
      ));
  }

  async getDeviationTypesForCustomField(customFieldId: number, tenantId: number): Promise<DeviationType[]> {
    return await db.select({
      id: deviationTypes.id,
      tenantId: deviationTypes.tenantId,
      name: deviationTypes.name,
      color: deviationTypes.color,
      order: deviationTypes.order,
      isActive: deviationTypes.isActive,
      description: deviationTypes.description,
      createdAt: deviationTypes.createdAt,
      updatedAt: deviationTypes.updatedAt,
    })
      .from(deviationTypes)
      .innerJoin(customFieldTypeMappings, eq(deviationTypes.id, customFieldTypeMappings.deviationTypeId))
      .where(and(
        eq(customFieldTypeMappings.customFieldId, customFieldId),
        eq(deviationTypes.tenantId, tenantId)
      ))
      .orderBy(asc(deviationTypes.name));
  }

  // === CUSTOM FIELD VALUES ===
  async getCustomFieldValues(deviationId: number, tenantId: number): Promise<(CustomFieldValue & { field: CustomField })[]> {
    // First verify deviation exists and belongs to tenant
    const deviation = await this.getDeviation(deviationId, tenantId);
    if (!deviation) {
      throw new Error('Deviation not found');
    }

    return await db.select({
      id: customFieldValues.id,
      deviationId: customFieldValues.deviationId,
      customFieldId: customFieldValues.customFieldId,
      value: customFieldValues.value,
      createdAt: customFieldValues.createdAt,
      updatedAt: customFieldValues.updatedAt,
      field: customFields,
    })
      .from(customFieldValues)
      .innerJoin(customFields, eq(customFieldValues.customFieldId, customFields.id))
      .where(eq(customFieldValues.deviationId, deviationId))
      .orderBy(asc(customFields.order), asc(customFields.name));
  }

  async setCustomFieldValue(value: InsertCustomFieldValue): Promise<CustomFieldValue> {
    // Use INSERT ... ON CONFLICT to handle upsert
    const [result] = await db.insert(customFieldValues)
      .values(value)
      .onConflictDoUpdate({
        target: [customFieldValues.deviationId, customFieldValues.customFieldId],
        set: {
          value: value.value,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async deleteCustomFieldValue(deviationId: number, customFieldId: number): Promise<void> {
    await db.delete(customFieldValues)
      .where(and(
        eq(customFieldValues.deviationId, deviationId),
        eq(customFieldValues.customFieldId, customFieldId)
      ));
  }

  // === ROLE MANAGEMENT ===
  async getRoles(tenantId: number): Promise<Role[]> {
    return await db.select()
      .from(roles)
      .where(eq(roles.tenantId, tenantId))
      .orderBy(asc(roles.name));
  }

  async getRole(id: string, tenantId: number): Promise<Role | undefined> {
    const [role] = await db.select()
      .from(roles)
      .where(and(eq(roles.id, id), eq(roles.tenantId, tenantId)));
    return role || undefined;
  }

  async createRole(role: InsertRole): Promise<Role> {
    const [newRole] = await db.insert(roles)
      .values(role)
      .returning();
    return newRole;
  }

  async updateRole(id: string, role: Partial<InsertRole>, tenantId: number): Promise<Role> {
    const [updatedRole] = await db.update(roles)
      .set(role)
      .where(and(eq(roles.id, id), eq(roles.tenantId, tenantId)))
      .returning();
    return updatedRole;
  }

  async deleteRole(id: string, tenantId: number): Promise<void> {
    await db.delete(roles)
      .where(and(eq(roles.id, id), eq(roles.tenantId, tenantId)));
  }

  // === USER-ROLE RELATIONSHIPS ===
  async getUserRoles(userId: number, tenantId: number): Promise<UserHasRole[]> {
    return await db.select({
      id: userHasRoles.id,
      userId: userHasRoles.userId,
      roleId: userHasRoles.roleId,
      createdAt: userHasRoles.createdAt,
    })
      .from(userHasRoles)
      .innerJoin(roles, eq(userHasRoles.roleId, roles.id))
      .where(and(
        eq(userHasRoles.userId, userId),
        eq(roles.tenantId, tenantId)
      ))
      .orderBy(asc(userHasRoles.createdAt));
  }

  async getRoleUsers(roleId: string, tenantId: number): Promise<UserHasRole[]> {
    return await db.select({
      id: userHasRoles.id,
      userId: userHasRoles.userId,
      roleId: userHasRoles.roleId,
      createdAt: userHasRoles.createdAt,
    })
      .from(userHasRoles)
      .innerJoin(roles, eq(userHasRoles.roleId, roles.id))
      .where(and(
        eq(userHasRoles.roleId, roleId),
        eq(roles.tenantId, tenantId)
      ))
      .orderBy(asc(userHasRoles.createdAt));
  }

  async getUserHasRole(id: string): Promise<UserHasRole | undefined> {
    const [userRole] = await db.select()
      .from(userHasRoles)
      .where(eq(userHasRoles.id, id));
    return userRole || undefined;
  }

  async assignRoleToUser(userRole: InsertUserHasRole): Promise<UserHasRole> {
    const [newUserRole] = await db.insert(userHasRoles)
      .values(userRole)
      .returning();
    return newUserRole;
  }

  async removeRoleFromUser(id: string): Promise<void> {
    await db.delete(userHasRoles)
      .where(eq(userHasRoles.id, id));
  }

  // === USER-DEPARTMENT RELATIONSHIPS ===
  async getUserDepartments(userId: number, tenantId: number): Promise<UserHasDepartment[]> {
    return await db.select({
      id: userHasDepartments.id,
      userId: userHasDepartments.userId,
      departmentId: userHasDepartments.departmentId,
      createdAt: userHasDepartments.createdAt,
    })
    .from(userHasDepartments)
    .innerJoin(users, eq(userHasDepartments.userId, users.id))
    .innerJoin(departments, eq(userHasDepartments.departmentId, departments.id))
    .where(and(
      eq(userHasDepartments.userId, userId),
      eq(users.tenantId, tenantId),
      eq(departments.tenantId, tenantId)
    ));
  }

  async getDepartmentUsers(departmentId: number, tenantId: number): Promise<UserHasDepartment[]> {
    return await db.select({
      id: userHasDepartments.id,
      userId: userHasDepartments.userId,
      departmentId: userHasDepartments.departmentId,
      createdAt: userHasDepartments.createdAt,
    })
    .from(userHasDepartments)
    .innerJoin(users, eq(userHasDepartments.userId, users.id))
    .innerJoin(departments, eq(userHasDepartments.departmentId, departments.id))
    .where(and(
      eq(userHasDepartments.departmentId, departmentId),
      eq(users.tenantId, tenantId),
      eq(departments.tenantId, tenantId)
    ));
  }

  async getUserHasDepartment(id: string): Promise<UserHasDepartment | undefined> {
    const [userDepartment] = await db.select()
      .from(userHasDepartments)
      .where(eq(userHasDepartments.id, id));
    return userDepartment || undefined;
  }

  async assignDepartmentToUser(userDepartment: InsertUserHasDepartment): Promise<UserHasDepartment> {
    const [newUserDepartment] = await db.insert(userHasDepartments)
      .values(userDepartment)
      .returning();
    return newUserDepartment;
  }

  async removeDepartmentFromUser(id: string): Promise<void> {
    await db.delete(userHasDepartments)
      .where(eq(userHasDepartments.id, id));
  }

  // === KANBAN MODULE IMPLEMENTATION ===

  // Kanban Boards
  
  async getKanbanBoards(
    tenantId: number,
    userId?: number,
    isAdmin = false
  ): Promise<KanbanBoardWithOwner[]> {
    const results = await db
      .select({
        board: kanbanBoards,
        ownerUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(kanbanBoards)
      .leftJoin(users, eq(kanbanBoards.ownerUserId, users.id))
      .where(eq(kanbanBoards.tenantId, tenantId))
      .orderBy(desc(kanbanBoards.createdAt));

    const boards = results.map(({ board, ownerUser }) => ({
      ...board,
      ownerUser,
    }));

    if (isAdmin) {
      return boards;
    }

    if (userId) {
      return boards.filter(
        (board) => board.ownerUserId === userId || board.isPublic === true
      );
    }

    return boards.filter((board) => board.isPublic === true);
  }


  async getKanbanBoard(
    id: string,
    tenantId: number,
    userId?: number,
    isAdmin = false
  ): Promise<KanbanBoard | undefined> {
    const [board] = await db.select()
      .from(kanbanBoards)
      .where(and(
        eq(kanbanBoards.id, id),
        eq(kanbanBoards.tenantId, tenantId)
      ));

    if (!board) return undefined;

    if (isAdmin) return board;

    if (userId && (board.ownerUserId === userId || board.isPublic)) {
      return board;
    }

    return undefined;
  }


  async createKanbanBoard(board: InsertKanbanBoard): Promise<KanbanBoard> {
    const [created] = await db.insert(kanbanBoards)
      .values(board)
      .returning();
    return created;
  }

  async updateKanbanBoard(id: string, board: Partial<InsertKanbanBoard>, tenantId: number): Promise<KanbanBoard> {
    const [updated] = await db.update(kanbanBoards)
      .set(board)
      .where(and(
        eq(kanbanBoards.id, id),
        eq(kanbanBoards.tenantId, tenantId)
      ))
      .returning();
    return updated;
  }

  async deleteKanbanBoard(id: string, tenantId: number): Promise<void> {
    await db.delete(kanbanBoards)
      .where(and(
        eq(kanbanBoards.id, id),
        eq(kanbanBoards.tenantId, tenantId)
      ));
  }

  // Kanban Columns
  async getKanbanColumns(
    boardId: string,
    tenantId: number,
    userId?: number,
    isAdmin = false
  ): Promise<KanbanColumn[]> {
    // Kontrollera åtkomst till board (inkl. admin/public)
    const board = await this.getKanbanBoard(boardId, tenantId, userId, isAdmin);
    if (!board) throw new Error("Board not found or access denied");

    return await db.select()
      .from(kanbanColumns)
      .where(eq(kanbanColumns.boardId, boardId))
      .orderBy(asc(kanbanColumns.position));
  }


  async getKanbanColumn(
    columnId: string,
    tenantId: number,
    userId?: number,
    isAdmin = false
  ): Promise<KanbanColumn | undefined> {
    const [result] = await db.select()
      .from(kanbanColumns)
      .innerJoin(kanbanBoards, eq(kanbanColumns.boardId, kanbanBoards.id))
      .where(and(
        eq(kanbanColumns.id, columnId),
        eq(kanbanBoards.tenantId, tenantId)
      ));

    if (!result) return undefined;

    const board = result.kanban_boards;

    const hasAccess =
      isAdmin ||
      board.isPublic ||
      (userId && board.ownerUserId === userId);

    if (!hasAccess) return undefined;

    return result.kanban_columns;
  }


  async createKanbanColumn(column: InsertKanbanColumn): Promise<KanbanColumn> {
    const [created] = await db.insert(kanbanColumns)
      .values(column)
      .returning();
    return created;
  }

  async updateKanbanColumn(id: string, column: Partial<InsertKanbanColumn>, tenantId: number): Promise<KanbanColumn> {
    const [updated] = await db.update(kanbanColumns)
      .set(column)
      .where(and(
        eq(kanbanColumns.id, id),
        // Verify through board tenant
        sql`${kanbanColumns.boardId} IN (SELECT id FROM ${kanbanBoards} WHERE tenant_id = ${tenantId})`
      ))
      .returning();
    return updated;
  }

  async deleteKanbanColumn(id: string, tenantId: number): Promise<void> {
    await db.delete(kanbanColumns)
      .where(and(
        eq(kanbanColumns.id, id),
        sql`${kanbanColumns.boardId} IN (SELECT id FROM ${kanbanBoards} WHERE tenant_id = ${tenantId})`
      ));
  }

  async reorderKanbanColumns(boardId: string, columnOrders: { id: string; position: number }[], tenantId: number): Promise<void> {
    // Verify board belongs to tenant
    const board = await this.getKanbanBoard(boardId, tenantId);
    if (!board) throw new Error('Board not found');

    for (const order of columnOrders) {
      await db.update(kanbanColumns)
        .set({ position: order.position })
        .where(and(
          eq(kanbanColumns.id, order.id),
          eq(kanbanColumns.boardId, boardId)
        ));
    }
  }

  // Kanban Cards
  async getKanbanCardsByBoard(
    boardId: string,
    tenantId: number,
    userId?: number,
    isAdmin = false
  ): Promise<KanbanCard[]> {
    const board = await this.getKanbanBoard(boardId, tenantId, userId, isAdmin);
    if (!board) throw new Error("Board not found or access denied");

    return await db.select()
      .from(kanbanCards)
      .innerJoin(kanbanColumns, eq(kanbanCards.columnId, kanbanColumns.id))
      .where(eq(kanbanColumns.boardId, boardId))
      .orderBy(asc(kanbanCards.position))
      .then(results => results.map(row => row.kanban_cards));
  }


  async getKanbanCards(
    columnId: string,
    tenantId: number,
    userId?: number,
    isAdmin = false
  ): Promise<KanbanCard[]> {
    const [result] = await db.select()
      .from(kanbanColumns)
      .innerJoin(kanbanBoards, eq(kanbanColumns.boardId, kanbanBoards.id))
      .where(and(
        eq(kanbanColumns.id, columnId),
        eq(kanbanBoards.tenantId, tenantId)
      ))
      .limit(1);

    if (!result) throw new Error("Column not found or access denied");

    const board = result.kanban_boards;
    const hasAccess =
      isAdmin ||
      board.isPublic ||
      (userId && board.ownerUserId === userId);

    if (!hasAccess) throw new Error("Access denied");

    return await db.select()
      .from(kanbanCards)
      .where(eq(kanbanCards.columnId, columnId))
      .orderBy(asc(kanbanCards.position));
  }


  async getKanbanCard(
    cardId: string,
    tenantId: number,
    userId?: number,
    isAdmin = false
  ): Promise<KanbanCard | undefined> {
    const [result] = await db.select()
      .from(kanbanCards)
      .innerJoin(kanbanColumns, eq(kanbanCards.columnId, kanbanColumns.id))
      .innerJoin(kanbanBoards, eq(kanbanColumns.boardId, kanbanBoards.id))
      .where(and(
        eq(kanbanCards.id, cardId),
        eq(kanbanBoards.tenantId, tenantId)
      ))
      .limit(1);

    if (!result) return undefined;

    const board = result.kanban_boards;
    const hasAccess =
      isAdmin ||
      board.isPublic ||
      (userId && board.ownerUserId === userId);

    if (!hasAccess) return undefined;

    return result.kanban_cards;
  }


  async createKanbanCard(card: InsertKanbanCard): Promise<KanbanCard> {
    const [created] = await db.insert(kanbanCards)
      .values(card)
      .returning();
    return created;
  }

  async updateKanbanCard(id: string, card: Partial<InsertKanbanCard>, tenantId: number): Promise<KanbanCard> {
    const [updated] = await db.update(kanbanCards)
      .set(card)
      .where(and(
        eq(kanbanCards.id, id),
        sql`${kanbanCards.columnId} IN (
          SELECT c.id FROM ${kanbanColumns} c 
          JOIN ${kanbanBoards} b ON c.board_id = b.id 
          WHERE b.tenant_id = ${tenantId}
        )`
      ))
      .returning();
    return updated;
  }

  async deleteKanbanCard(id: string, tenantId: number): Promise<void> {
    await db.delete(kanbanCards)
      .where(and(
        eq(kanbanCards.id, id),
        sql`${kanbanCards.columnId} IN (
          SELECT c.id FROM ${kanbanColumns} c 
          JOIN ${kanbanBoards} b ON c.board_id = b.id 
          WHERE b.tenant_id = ${tenantId}
        )`
      ));
  }

  async moveKanbanCard(cardId: string, newColumnId: string, newPosition: number, tenantId: number): Promise<KanbanCard> {
    const [updated] = await db.update(kanbanCards)
      .set({ 
        columnId: newColumnId, 
        position: newPosition 
      })
      .where(and(
        eq(kanbanCards.id, cardId),
        sql`${kanbanCards.columnId} IN (
          SELECT c.id FROM ${kanbanColumns} c 
          JOIN ${kanbanBoards} b ON c.board_id = b.id 
          WHERE b.tenant_id = ${tenantId}
        )`
      ))
      .returning();
    return updated;
  }

  async reorderKanbanCards(columnId: string, cardOrders: { id: string; position: number }[], tenantId: number): Promise<void> {
    for (const order of cardOrders) {
      await db.update(kanbanCards)
        .set({ position: order.position })
        .where(and(
          eq(kanbanCards.id, order.id),
          eq(kanbanCards.columnId, columnId),
          sql`${kanbanCards.columnId} IN (
            SELECT c.id FROM ${kanbanColumns} c 
            JOIN ${kanbanBoards} b ON c.board_id = b.id 
            WHERE b.tenant_id = ${tenantId}
          )`
        ));
    }
  }

  // Kanban Board Sharing
  async getKanbanBoardShares(boardId: string, tenantId: number): Promise<KanbanBoardShare[]> {
    return await db.select()
      .from(kanbanBoardShares)
      .innerJoin(kanbanBoards, eq(kanbanBoardShares.boardId, kanbanBoards.id))
      .where(and(
        eq(kanbanBoardShares.boardId, boardId),
        eq(kanbanBoards.tenantId, tenantId)
      ));
  }

  async createKanbanBoardShare(share: InsertKanbanBoardShare): Promise<KanbanBoardShare> {
    const [created] = await db.insert(kanbanBoardShares)
      .values(share)
      .returning();
    return created;
  }

  async deleteKanbanBoardShare(id: string, tenantId: number): Promise<void> {
    await db.delete(kanbanBoardShares)
      .where(and(
        eq(kanbanBoardShares.id, id),
        sql`${kanbanBoardShares.boardId} IN (SELECT id FROM ${kanbanBoards} WHERE tenant_id = ${tenantId})`
      ));
  }

  // User Kanban Preferences
  async getUserKanbanPreferences(userId: number): Promise<UserKanbanPreference[]> {
    return await db.select()
      .from(userKanbanPreferences)
      .where(eq(userKanbanPreferences.userId, userId))
      .orderBy(asc(userKanbanPreferences.pinnedPosition));
  }

  async getUserKanbanPreference(userId: number, boardId: string): Promise<UserKanbanPreference | undefined> {
    const [preference] = await db.select()
      .from(userKanbanPreferences)
      .where(and(
        eq(userKanbanPreferences.userId, userId),
        eq(userKanbanPreferences.boardId, boardId)
      ));
    return preference || undefined;
  }

  async setUserKanbanPreference(preference: InsertUserKanbanPreference): Promise<UserKanbanPreference> {
    // Use upsert pattern - try to update first, then insert if not exists
    const existing = await this.getUserKanbanPreference(preference.userId, preference.boardId);
    
    if (existing) {
      const [updated] = await db.update(userKanbanPreferences)
        .set({
          showInQuickAccess: preference.showInQuickAccess,
          pinnedPosition: preference.pinnedPosition,
        })
        .where(and(
          eq(userKanbanPreferences.userId, preference.userId),
          eq(userKanbanPreferences.boardId, preference.boardId)
        ))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(userKanbanPreferences)
        .values(preference)
        .returning();
      return created;
    }
  }

  async updateUserKanbanPreference(userId: number, boardId: string, updates: Partial<InsertUserKanbanPreference>): Promise<UserKanbanPreference> {
    const [updated] = await db.update(userKanbanPreferences)
      .set(updates)
      .where(and(
        eq(userKanbanPreferences.userId, userId),
        eq(userKanbanPreferences.boardId, boardId)
      ))
      .returning();
    return updated;
  }

  async deleteUserKanbanPreference(userId: number, boardId: string): Promise<void> {
    await db.delete(userKanbanPreferences)
      .where(and(
        eq(userKanbanPreferences.userId, userId),
        eq(userKanbanPreferences.boardId, boardId)
      ));
  }
}

export const storage = new DatabaseStorage();