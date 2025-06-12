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
import { eq, desc, sql, and } from "drizzle-orm";

export interface IStorage {
  // === MULTI-TENANT CORE ===
  // Tenants
  getTenants(): Promise<Tenant[]>;
  getTenant(id: number): Promise<Tenant | undefined>;
  getTenantBySubdomain(subdomain: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: number, tenant: Partial<InsertTenant>): Promise<Tenant>;
  deleteTenant(id: number): Promise<void>;

  // Users  
  getUsers(tenantId: number): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string, tenantId: number): Promise<User | undefined>;
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
  // Work Tasks
  async getWorkTasks(): Promise<WorkTask[]> {
    return await db.select().from(workTasks).orderBy(workTasks.name);
  }

  async getWorkTask(id: number): Promise<WorkTask | undefined> {
    const [workTask] = await db.select().from(workTasks).where(eq(workTasks.id, id));
    return workTask || undefined;
  }

  async createWorkTask(workTask: InsertWorkTask): Promise<WorkTask> {
    const [created] = await db.insert(workTasks).values(workTask).returning();
    return created;
  }

  async updateWorkTask(id: number, workTask: Partial<InsertWorkTask>): Promise<WorkTask> {
    const [updated] = await db.update(workTasks).set(workTask).where(eq(workTasks.id, id)).returning();
    return updated;
  }

  async deleteWorkTask(id: number): Promise<void> {
    await db.delete(workTasks).where(eq(workTasks.id, id));
  }

  // Work Stations
  async getWorkStations(workTaskId?: number): Promise<WorkStation[]> {
    if (workTaskId) {
      return await db.select().from(workStations).where(eq(workStations.workTaskId, workTaskId)).orderBy(workStations.name);
    }
    return await db.select().from(workStations).orderBy(workStations.name);
  }

  async getWorkStation(id: number): Promise<WorkStation | undefined> {
    const [workStation] = await db.select().from(workStations).where(eq(workStations.id, id));
    return workStation || undefined;
  }

  async createWorkStation(workStation: InsertWorkStation): Promise<WorkStation> {
    const [created] = await db.insert(workStations).values(workStation).returning();
    return created;
  }

  async updateWorkStation(id: number, workStation: Partial<InsertWorkStation>): Promise<WorkStation> {
    const [updated] = await db.update(workStations).set(workStation).where(eq(workStations.id, id)).returning();
    return updated;
  }

  async deleteWorkStation(id: number): Promise<void> {
    await db.delete(workStations).where(eq(workStations.id, id));
  }

  // Shifts
  async getShifts(): Promise<Shift[]> {
    return await db.select().from(shifts).where(eq(shifts.isActive, true)).orderBy(shifts.order);
  }

  async getShift(id: number): Promise<Shift | undefined> {
    const [shift] = await db.select().from(shifts).where(eq(shifts.id, id));
    return shift || undefined;
  }

  async createShift(shift: InsertShift): Promise<Shift> {
    const [created] = await db.insert(shifts).values(shift).returning();
    return created;
  }

  async updateShift(id: number, shift: Partial<InsertShift>): Promise<Shift> {
    const [updated] = await db.update(shifts).set(shift).where(eq(shifts.id, id)).returning();
    return updated;
  }

  async deleteShift(id: number): Promise<void> {
    await db.delete(shifts).where(eq(shifts.id, id));
  }

  // Categories
  async getCategories(checklistId: number): Promise<Category[]> {
    return await db.select().from(categories).where(
      and(
        eq(categories.checklistId, checklistId),
        eq(categories.isActive, true)
      )
    ).orderBy(categories.order);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category> {
    const [updated] = await db.update(categories).set(category).where(eq(categories.id, id)).returning();
    return updated;
  }

  async deleteCategory(id: number): Promise<void> {
    // First delete all questions that belong to this category
    await db.delete(questions).where(eq(questions.categoryId, id));
    // Then delete the category
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Questions
  async getQuestions(categoryId: number): Promise<Question[]> {
    return await db.select().from(questions).where(eq(questions.categoryId, categoryId)).orderBy(questions.order);
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question || undefined;
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [created] = await db.insert(questions).values(question).returning();
    
    // Update checklist hasDashboard if showInDashboard is true
    if (question.showInDashboard) {
      await this.updateChecklistDashboardStatus(created.categoryId);
    }
    
    return created;
  }

  async updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question> {
    const [updated] = await db.update(questions).set(question).where(eq(questions.id, id)).returning();
    
    // Update checklist hasDashboard if showInDashboard changed
    if (question.showInDashboard !== undefined) {
      await this.updateChecklistDashboardStatus(updated.categoryId);
    }
    
    return updated;
  }

  async deleteQuestion(id: number): Promise<void> {
    // Get the question before deleting to know which checklist to update
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    await db.delete(questions).where(eq(questions.id, id));
    
    // Update checklist hasDashboard if the deleted question had showInDashboard
    if (question?.showInDashboard) {
      await this.updateChecklistDashboardStatus(question.categoryId);
    }
  }

  // Helper function to update checklist hasDashboard based on questions
  private async updateChecklistDashboardStatus(categoryId: number): Promise<void> {
    // Get the checklist ID from the category
    const [category] = await db.select().from(categories).where(eq(categories.id, categoryId));
    if (!category) return;

    // Check if any questions in this checklist have showInDashboard = true
    const dashboardQuestions = await db.select()
      .from(questions)
      .innerJoin(categories, eq(questions.categoryId, categories.id))
      .where(and(
        eq(categories.checklistId, category.checklistId),
        eq(questions.showInDashboard, true)
      ))
      .limit(1);

    const hasDashboard = dashboardQuestions.length > 0;
    
    // Update the checklist
    await db.update(checklists)
      .set({ hasDashboard })
      .where(eq(checklists.id, category.checklistId));
  }

  // Checklists
  async getChecklists(): Promise<Checklist[]> {
    return await db.select().from(checklists).orderBy(checklists.order);
  }

  async getActiveChecklists(): Promise<Checklist[]> {
    return await db.select().from(checklists).where(
      and(
        eq(checklists.isActive, true),
        eq(checklists.showInMenu, true)
      )
    ).orderBy(checklists.order, checklists.id);
  }

  async getAllActiveChecklists(): Promise<Checklist[]> {
    return await db.select().from(checklists).where(
      eq(checklists.isActive, true)
    ).orderBy(checklists.order, checklists.id);
  }

  async getChecklist(id: number): Promise<Checklist | undefined> {
    const [checklist] = await db.select().from(checklists).where(eq(checklists.id, id));
    return checklist || undefined;
  }

  async createChecklist(checklist: InsertChecklist): Promise<Checklist> {
    const [created] = await db.insert(checklists).values(checklist).returning();
    return created;
  }

  async updateChecklist(id: number, checklist: Partial<InsertChecklist>): Promise<Checklist> {
    const [updated] = await db.update(checklists).set(checklist).where(eq(checklists.id, id)).returning();
    return updated;
  }

  async deleteChecklist(id: number): Promise<void> {
    await db.delete(checklists).where(eq(checklists.id, id));
  }

  // Checklist Work Tasks
  async getChecklistWorkTasks(checklistId: number): Promise<ChecklistWorkTask[]> {
    return await db.select().from(checklistWorkTasks).where(eq(checklistWorkTasks.checklistId, checklistId));
  }

  async createChecklistWorkTask(checklistWorkTask: InsertChecklistWorkTask): Promise<ChecklistWorkTask> {
    const [created] = await db.insert(checklistWorkTasks).values(checklistWorkTask).returning();
    return created;
  }

  async deleteChecklistWorkTask(checklistId: number, workTaskId: number): Promise<void> {
    await db.delete(checklistWorkTasks).where(
      and(
        eq(checklistWorkTasks.checklistId, checklistId),
        eq(checklistWorkTasks.workTaskId, workTaskId)
      )
    );
  }



  // Checklist Responses
  async getChecklistResponses(filters: { 
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
    
    const conditions = [];

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

    if (conditions.length > 0) {
      return await db.select().from(checklistResponses)
        .where(and(...conditions))
        .orderBy(desc(checklistResponses.createdAt))
        .limit(limit)
        .offset(offset);
    }
    
    return await db.select().from(checklistResponses)
      .orderBy(desc(checklistResponses.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getChecklistResponse(id: number): Promise<ChecklistResponse | undefined> {
    const [response] = await db.select().from(checklistResponses).where(eq(checklistResponses.id, id));
    return response || undefined;
  }

  async createChecklistResponse(response: InsertChecklistResponse): Promise<ChecklistResponse> {
    const [created] = await db.insert(checklistResponses).values(response).returning();
    return created;
  }

  async updateChecklistResponse(id: number, response: Partial<InsertChecklistResponse>): Promise<ChecklistResponse> {
    const [updated] = await db.update(checklistResponses).set(response).where(eq(checklistResponses.id, id)).returning();
    return updated;
  }

  async deleteChecklistResponse(id: number): Promise<void> {
    await db.delete(checklistResponses).where(eq(checklistResponses.id, id));
  }

  // Dashboard Statistics
  async getDashboardStats(filters: {
    checklistId?: number;
    workTaskId?: number;
    workStationId?: number;
    shiftId?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
  } = {}): Promise<any> {
    const { checklistId, workTaskId, workStationId, shiftId, startDate, endDate, search } = filters;
    const conditions = [];
    
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

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;
    
    let totalQuery = db.select({ count: sql<number>`count(*)` }).from(checklistResponses);
    let recentQuery = db.select().from(checklistResponses);

    if (whereCondition) {
      totalQuery = totalQuery.where(whereCondition);
      recentQuery = recentQuery.where(whereCondition);
    }

    const totalResponses = await totalQuery.execute();
    const recentResponses = await recentQuery
      .orderBy(desc(checklistResponses.createdAt))
      .limit(10)
      .execute();

    return {
      totalResponses: totalResponses[0]?.count || 0,
      recentResponses
    };
  }

  // Dashboard Questions
  async getDashboardQuestions(checklistId: number): Promise<Question[]> {
    return await db.select({
      id: questions.id,
      categoryId: questions.categoryId,
      text: questions.text,
      type: questions.type,
      options: questions.options,
      validation: questions.validation,
      showInDashboard: questions.showInDashboard,
      dashboardDisplayType: questions.dashboardDisplayType,
      hideInView: questions.hideInView,
      order: questions.order,
      isRequired: questions.isRequired,
    })
      .from(questions)
      .innerJoin(categories, eq(questions.categoryId, categories.id))
      .where(and(
        eq(categories.checklistId, checklistId),
        eq(questions.showInDashboard, true)
      ))
      .orderBy(questions.order);
  }

  // Admin Settings
  async getAdminSettings(): Promise<AdminSetting[]> {
    return await db.select().from(adminSettings);
  }

  async getAdminSetting(key: string): Promise<AdminSetting | undefined> {
    const [setting] = await db.select().from(adminSettings).where(eq(adminSettings.key, key));
    return setting || undefined;
  }

  async setAdminSetting(setting: InsertAdminSetting): Promise<AdminSetting> {
    const existing = await this.getAdminSetting(setting.key);
    if (existing) {
      const [updated] = await db.update(adminSettings).set({ value: setting.value }).where(eq(adminSettings.key, setting.key)).returning();
      return updated;
    } else {
      const [created] = await db.insert(adminSettings).values(setting).returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
