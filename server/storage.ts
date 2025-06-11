import { 
  workTasks, workStations, shifts, categories, questions, checklists, 
  checklistWorkTasks, checklistQuestions, checklistResponses, adminSettings,
  type WorkTask, type InsertWorkTask, type WorkStation, type InsertWorkStation,
  type Shift, type InsertShift, type Category, type InsertCategory,
  type Question, type InsertQuestion, type Checklist, type InsertChecklist,
  type ChecklistWorkTask, type InsertChecklistWorkTask,
  type ChecklistQuestion, type InsertChecklistQuestion,
  type ChecklistResponse, type InsertChecklistResponse,
  type AdminSetting, type InsertAdminSetting
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";

export interface IStorage {
  // Work Tasks
  getWorkTasks(): Promise<WorkTask[]>;
  getWorkTask(id: number): Promise<WorkTask | undefined>;
  createWorkTask(workTask: InsertWorkTask): Promise<WorkTask>;
  updateWorkTask(id: number, workTask: Partial<InsertWorkTask>): Promise<WorkTask>;
  deleteWorkTask(id: number): Promise<void>;

  // Work Stations
  getWorkStations(workTaskId?: number): Promise<WorkStation[]>;
  getWorkStation(id: number): Promise<WorkStation | undefined>;
  createWorkStation(workStation: InsertWorkStation): Promise<WorkStation>;
  updateWorkStation(id: number, workStation: Partial<InsertWorkStation>): Promise<WorkStation>;
  deleteWorkStation(id: number): Promise<void>;

  // Shifts
  getShifts(): Promise<Shift[]>;
  getShift(id: number): Promise<Shift | undefined>;
  createShift(shift: InsertShift): Promise<Shift>;
  updateShift(id: number, shift: Partial<InsertShift>): Promise<Shift>;
  deleteShift(id: number): Promise<void>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  // Questions
  getQuestions(categoryId?: number): Promise<Question[]>;
  getQuestion(id: number): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question>;
  deleteQuestion(id: number): Promise<void>;

  // Checklists
  getChecklists(): Promise<Checklist[]>;
  getChecklist(id: number): Promise<Checklist | undefined>;
  createChecklist(checklist: InsertChecklist): Promise<Checklist>;
  updateChecklist(id: number, checklist: Partial<InsertChecklist>): Promise<Checklist>;
  deleteChecklist(id: number): Promise<void>;

  // Checklist Work Tasks
  getChecklistWorkTasks(checklistId: number): Promise<ChecklistWorkTask[]>;
  createChecklistWorkTask(checklistWorkTask: InsertChecklistWorkTask): Promise<ChecklistWorkTask>;
  deleteChecklistWorkTask(checklistId: number, workTaskId: number): Promise<void>;

  // Checklist Questions
  getChecklistQuestions(checklistId: number): Promise<ChecklistQuestion[]>;
  createChecklistQuestion(checklistQuestion: InsertChecklistQuestion): Promise<ChecklistQuestion>;
  deleteChecklistQuestion(checklistId: number, questionId: number): Promise<void>;

  // Checklist Responses
  getChecklistResponses(filters?: { limit?: number; offset?: number }): Promise<ChecklistResponse[]>;
  getChecklistResponse(id: number): Promise<ChecklistResponse | undefined>;
  createChecklistResponse(response: InsertChecklistResponse): Promise<ChecklistResponse>;
  updateChecklistResponse(id: number, response: Partial<InsertChecklistResponse>): Promise<ChecklistResponse>;
  deleteChecklistResponse(id: number): Promise<void>;

  // Dashboard Statistics
  getDashboardStats(): Promise<any>;

  // Admin Settings
  getAdminSettings(): Promise<AdminSetting[]>;
  getAdminSetting(key: string): Promise<AdminSetting | undefined>;
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
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(categories.order);
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
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Questions
  async getQuestions(categoryId?: number): Promise<Question[]> {
    if (categoryId) {
      return await db.select().from(questions).where(eq(questions.categoryId, categoryId)).orderBy(questions.order);
    }
    return await db.select().from(questions).orderBy(questions.order);
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question || undefined;
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [created] = await db.insert(questions).values(question).returning();
    return created;
  }

  async updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question> {
    const [updated] = await db.update(questions).set(question).where(eq(questions.id, id)).returning();
    return updated;
  }

  async deleteQuestion(id: number): Promise<void> {
    await db.delete(questions).where(eq(questions.id, id));
  }

  // Checklists
  async getChecklists(): Promise<Checklist[]> {
    return await db.select().from(checklists).where(eq(checklists.isActive, true)).orderBy(checklists.order);
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

  // Checklist Questions
  async getChecklistQuestions(checklistId: number): Promise<ChecklistQuestion[]> {
    return await db.select().from(checklistQuestions).where(eq(checklistQuestions.checklistId, checklistId));
  }

  async createChecklistQuestion(checklistQuestion: InsertChecklistQuestion): Promise<ChecklistQuestion> {
    const [created] = await db.insert(checklistQuestions).values(checklistQuestion).returning();
    return created;
  }

  async deleteChecklistQuestion(checklistId: number, questionId: number): Promise<void> {
    await db.delete(checklistQuestions).where(
      and(
        eq(checklistQuestions.checklistId, checklistId),
        eq(checklistQuestions.questionId, questionId)
      )
    );
  }

  // Checklist Responses
  async getChecklistResponses(filters: { limit?: number; offset?: number } = {}): Promise<ChecklistResponse[]> {
    const { limit = 50, offset = 0 } = filters;
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
  async getDashboardStats(): Promise<any> {
    const totalResponses = await db.select({ count: sql<number>`count(*)` }).from(checklistResponses);
    const completedResponses = await db.select({ count: sql<number>`count(*)` }).from(checklistResponses).where(eq(checklistResponses.isCompleted, true));
    const recentResponses = await db.select().from(checklistResponses)
      .orderBy(desc(checklistResponses.createdAt))
      .limit(10);

    return {
      totalResponses: totalResponses[0]?.count || 0,
      completedResponses: completedResponses[0]?.count || 0,
      recentResponses
    };
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
