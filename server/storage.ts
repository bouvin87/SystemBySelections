import { 
  tenants, users, workTasks, workStations, shifts, categories, questions, checklists, 
  checklistWorkTasks, checklistResponses, adminSettings,
  type Tenant, type InsertTenant, type User, type InsertUser,
  type WorkTask, type InsertWorkTask, type WorkStation, type InsertWorkStation,
  type Shift, type InsertShift, type Category, type InsertCategory,
  type Question, type InsertQuestion, type Checklist, type InsertChecklist,
  type ChecklistWorkTask, type InsertChecklistWorkTask,
  type ChecklistResponse, type InsertChecklistResponse,
  type AdminSetting, type InsertAdminSetting
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, count } from "drizzle-orm";

export interface IStorage {
  // === MULTI-TENANT CORE ===
  // Tenants
  getTenants(): Promise<Tenant[]>;
  getTenant(id: number): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: number, tenant: Partial<InsertTenant>): Promise<Tenant>;
  deleteTenant(id: number): Promise<void>;

  // Users  
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

  // Admin Settings (tenant-scoped)
  getAdminSettings(tenantId: number): Promise<AdminSetting[]>;
  getAdminSetting(key: string, tenantId: number): Promise<AdminSetting | undefined>;
  setAdminSetting(setting: InsertAdminSetting): Promise<AdminSetting>;
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
    await db.delete(questions).where(and(eq(questions.id, id), eq(questions.tenantId, tenantId)));
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
    const { limit = 50, offset = 0, checklistId, workTaskId, workStationId, shiftId, search } = filters;
    
    let query = db.select().from(checklistResponses)
      .where(eq(checklistResponses.tenantId, tenantId));

    if (checklistId) {
      query = query.where(and(eq(checklistResponses.tenantId, tenantId), eq(checklistResponses.checklistId, checklistId)));
    }
    if (workTaskId) {
      query = query.where(and(eq(checklistResponses.tenantId, tenantId), eq(checklistResponses.workTaskId, workTaskId)));
    }
    if (workStationId) {
      query = query.where(and(eq(checklistResponses.tenantId, tenantId), eq(checklistResponses.workStationId, workStationId)));
    }
    if (shiftId) {
      query = query.where(and(eq(checklistResponses.tenantId, tenantId), eq(checklistResponses.shiftId, shiftId)));
    }

    return await query
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
    const { checklistId } = filters;
    
    // Build base where condition with tenant filtering
    let whereCondition = eq(checklistResponses.tenantId, tenantId);
    
    if (checklistId) {
      whereCondition = and(whereCondition, eq(checklistResponses.checklistId, checklistId));
    }

    // Get total responses count
    const totalQuery = await db.select({ count: count() })
      .from(checklistResponses)
      .where(whereCondition);
    
    const totalResponses = totalQuery[0]?.count || 0;

    // Get recent responses
    const recentResponses = await db.select()
      .from(checklistResponses)
      .where(whereCondition)
      .orderBy(desc(checklistResponses.createdAt))
      .limit(10);

    return {
      totalResponses,
      recentResponses,
    };
  }

  // Dashboard Questions
  async getDashboardQuestions(checklistId: number, tenantId: number): Promise<Question[]> {
    return await db.select().from(questions)
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
}

export const storage = new DatabaseStorage();