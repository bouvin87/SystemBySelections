import { 
  tenants, users, workTasks, workStations, shifts, categories, questions, checklists, 
  checklistWorkTasks, checklistResponses, adminSettings, questionWorkTasks,
  deviationTypes, deviationPriorities, deviationStatuses, deviations, deviationComments, deviationLogs, deviationSettings,
  type Tenant, type InsertTenant, type User, type InsertUser,
  type WorkTask, type InsertWorkTask, type WorkStation, type InsertWorkStation,
  type Shift, type InsertShift, type Category, type InsertCategory,
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
  type DeviationSetting, type InsertDeviationSetting
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

  // Categories (tenant-scoped, belonging to checklists)
  getCategories(checklistId: number, tenantId: number): Promise<Category[]>;
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
  getChecklist(id: number, tenantId: number): Promise<Checklist | undefined>;
  createChecklist(checklist: InsertChecklist): Promise<Checklist>;
  updateChecklist(id: number, checklist: Partial<InsertChecklist>, tenantId: number): Promise<Checklist>;
  deleteChecklist(id: number, tenantId: number): Promise<void>;

  // Checklist Work Tasks (tenant-scoped)
  getChecklistWorkTasks(checklistId: number, tenantId: number): Promise<ChecklistWorkTask[]>;
  createChecklistWorkTask(checklistWorkTask: InsertChecklistWorkTask): Promise<ChecklistWorkTask>;
  deleteChecklistWorkTask(checklistId: number, workTaskId: number, tenantId: number): Promise<void>;

  // Checklist Responses (tenant-scoped)
  getChecklistResponses(tenantId: number, filters?: { 
    limit?: number; 
    offset?: number; 
    checklistId?: number;
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
    checklistId?: number;
    workTaskId?: number;
    workStationId?: number;
    shiftId?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<any>;

  // Dashboard Questions (tenant-scoped)
  getDashboardQuestions(checklistId: number, tenantId: number): Promise<Question[]>;

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
    return await db.select().from(users).where(eq(users.tenantId, tenantId));
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

  // Categories
  async getCategories(checklistId: number, tenantId: number): Promise<Category[]> {
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

  async getChecklist(id: number, tenantId: number): Promise<Checklist | undefined> {
    const [checklist] = await db.select().from(checklists).where(
      and(eq(checklists.id, id), eq(checklists.tenantId, tenantId))
    );
    return checklist || undefined;
  }

  async createChecklist(checklist: InsertChecklist): Promise<Checklist> {
    const [created] = await db.insert(checklists).values(checklist).returning();
    return created;
  }

  async updateChecklist(id: number, checklist: Partial<InsertChecklist>, tenantId: number): Promise<Checklist> {
    const [updated] = await db.update(checklists)
      .set(checklist)
      .where(and(eq(checklists.id, id), eq(checklists.tenantId, tenantId)))
      .returning();
    return updated;
  }

  async deleteChecklist(id: number, tenantId: number): Promise<void> {
    await db.delete(checklists).where(and(eq(checklists.id, id), eq(checklists.tenantId, tenantId)));
  }

  // Checklist Work Tasks
  async getChecklistWorkTasks(checklistId: number, tenantId: number): Promise<ChecklistWorkTask[]> {
    return await db.select().from(checklistWorkTasks).where(
      and(eq(checklistWorkTasks.checklistId, checklistId), eq(checklistWorkTasks.tenantId, tenantId))
    );
  }

  async createChecklistWorkTask(checklistWorkTask: InsertChecklistWorkTask): Promise<ChecklistWorkTask> {
    const [created] = await db.insert(checklistWorkTasks).values(checklistWorkTask).returning();
    return created;
  }

  async deleteChecklistWorkTask(checklistId: number, workTaskId: number, tenantId: number): Promise<void> {
    await db.delete(checklistWorkTasks).where(
      and(
        eq(checklistWorkTasks.checklistId, checklistId),
        eq(checklistWorkTasks.workTaskId, workTaskId),
        eq(checklistWorkTasks.tenantId, tenantId)
      )
    );
  }

  async deleteAllChecklistWorkTasks(checklistId: number, tenantId: number): Promise<void> {
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
    checklistId?: number;
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
    checklistId?: number;
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
  async getDashboardQuestions(checklistId: number, tenantId: number): Promise<Question[]> {
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
  }): Promise<Deviation[]> {
    const conditions = [eq(deviations.tenantId, tenantId)];
    
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

  async getDeviation(id: number, tenantId: number): Promise<Deviation | undefined> {
    const result = await db.select().from(deviations)
      .where(and(eq(deviations.id, id), eq(deviations.tenantId, tenantId)))
      .limit(1);
    return result[0];
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
      'Avvikelse skapad'
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
      
      if (deviation.dueDate !== undefined && oldDeviation.dueDate !== newDeviation.dueDate) {
        await this.logDeviationChange(
          id, userId, 'field_changed', 'dueDate', 
          oldDeviation.dueDate?.toISOString(), newDeviation.dueDate?.toISOString(), 
          'field_changed_due_date'
        );
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
}

export const storage = new DatabaseStorage();