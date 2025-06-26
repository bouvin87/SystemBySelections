/**
 * DEVIATIONS MODULE ROUTES
 *
 * Handles deviations - issues that need to be addressed and corrected
 * based on checklist responses or other quality/safety issues.
 */

import type { Express, Request } from "express";
import { z } from "zod";
import { storage } from "../../storage";
import {
  authenticateToken,
  requireModule,
  validateTenantOwnership,
  enforceTenantIsolation,
} from "../../middleware/auth";

// Define AuthenticatedRequest type locally
interface AuthenticatedRequest extends Request {
  user?: any;
  tenantId?: number;
  tenant?: any;
}
import {
  insertDeviationTypeSchema,
  insertDeviationSchema,
  insertDeviationCommentSchema,
} from "@shared/schema";
import { emailService } from "../../email";
import { render } from "@react-email/render";
import { DeviationUpdatedEmail } from "../../emails/DeviationUpdated";

export default function deviationRoutes(app: Express) {
  // === GET /api/deviations - List deviations ===
  app.get(
    "/api/deviations",
    authenticateToken,
    requireModule("deviations"),
    validateTenantOwnership,
    enforceTenantIsolation,
    async (req: AuthenticatedRequest, res) => {
      try {
        const tenantId = req.tenantId!;

        // Parse query parameters
        const filters = {
          status: req.query.status as string | undefined,
          priority: req.query.priority as string | undefined,
          assignedToUserId: req.query.assignedToUserId
            ? parseInt(req.query.assignedToUserId as string)
            : undefined,
          createdByUserId: req.query.createdByUserId
            ? parseInt(req.query.createdByUserId as string)
            : undefined,
          workTaskId: req.query.workTaskId
            ? parseInt(req.query.workTaskId as string)
            : undefined,
          locationId: req.query.locationId
            ? parseInt(req.query.locationId as string)
            : undefined,
          deviationTypeId: req.query.deviationTypeId
            ? parseInt(req.query.deviationTypeId as string)
            : undefined,
          search: req.query.search as string | undefined,
          limit: req.query.limit
            ? parseInt(req.query.limit as string)
            : undefined,
          offset: req.query.offset
            ? parseInt(req.query.offset as string)
            : undefined,
        };

        const deviations = await storage.getDeviations(tenantId, {
          ...filters,
          userId: req.user?.userId,
          userRole: req.user?.role,
          userDepartmentId: req.user?.departmentId,
        });
        res.json(deviations);
      } catch (error) {
        console.error("Error fetching deviations:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // === GET /api/deviations/stats - Get deviation statistics ===
  app.get(
    "/api/deviations/stats",
    authenticateToken,
    requireModule("deviations"),
    validateTenantOwnership,
    enforceTenantIsolation,
    async (req: AuthenticatedRequest, res) => {
      try {
        const tenantId = req.tenantId!;
        const stats = await storage.getDeviationStats(tenantId);
        res.json(stats);
      } catch (error) {
        console.error("Error fetching deviation stats:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // === GET /api/deviations/:id - Get single deviation ===
  app.get(
    "/api/deviations/:id",
    authenticateToken,
    requireModule("deviations"),
    validateTenantOwnership,
    enforceTenantIsolation,
    async (req: AuthenticatedRequest, res) => {
      try {
        const tenantId = req.tenantId!;
        const deviationId = parseInt(req.params.id);

        if (isNaN(deviationId)) {
          return res.status(400).json({ message: "Invalid deviation ID" });
        }

        const deviation = await storage.getDeviation(
          deviationId, 
          tenantId, 
          req.user?.userId, 
          req.user?.role, 
          req.user?.departmentId
        );

        if (!deviation) {
          return res.status(404).json({ message: "Deviation not found" });
        }

        res.json(deviation);
      } catch (error) {
        console.error("Error fetching deviation:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // === POST /api/deviations - Create deviation ===
  app.post(
    "/api/deviations",
    authenticateToken,
    requireModule("deviations"),
    validateTenantOwnership,
    enforceTenantIsolation,
    async (req: AuthenticatedRequest, res) => {
      try {
        const tenantId = req.tenantId!;
        const userId = req.user!.userId;

        // Get default status for the tenant
        const defaultStatus = await storage.getDefaultDeviationStatus(tenantId);

        const deviationData = {
          ...req.body,
          tenantId,
          createdByUserId: userId,
          statusId: defaultStatus?.id, // Set to default status
        };

        // Auto-assign based on department's responsible user (only if no manual assignment)
        if (deviationData.departmentId && !deviationData.assignedToUserId) {
          const department = await storage.getDepartment(
            deviationData.departmentId,
            tenantId,
          );
          if (department?.responsibleUserId) {
            deviationData.assignedToUserId = department.responsibleUserId;
          }
        }

        const validatedData = insertDeviationSchema.parse(deviationData);
        const deviation = await storage.createDeviation(validatedData);

        // Send email notifications
        try {
          const creator = await storage.getUserById(userId);
          const type = await storage.getDeviationTypeById(
            deviation.deviationTypeId,
            tenantId,
          );
          const department = deviation.departmentId 
            ? await storage.getDepartment(deviation.departmentId, tenantId)
            : null;

          const status = deviation.statusId 
            ? await storage.getDeviationStatus(deviation.statusId, tenantId)
            : null;

          if (creator && type) {
            const notifyUsers = [creator]; // Always notify creator

            // Also notify assigned user if different from creator
            if (
              deviation.assignedToUserId &&
              deviation.assignedToUserId !== userId
            ) {
              const assignedUser = await storage.getUserById(
                deviation.assignedToUserId,
              );
              if (assignedUser) {
                notifyUsers.push(assignedUser);
              }
            }

            // Transform objects to ensure string colors for email templates
            const typeForEmail = {
              name: type.name,
              color: type.color || '#3b82f6'
            };
            const departmentForEmail = department ? {
              name: department.name,
              color: department.color || '#6b7280'
            } : undefined;
            const statusForEmail = status ? {
              name: status.name,
              color: status.color || '#10b981'
            } : undefined;

            await emailService.notifyDeviationCreated(
              deviation,
              creator,
              typeForEmail,
              notifyUsers,
              departmentForEmail,
              statusForEmail,
            );
          }
        } catch (emailError) {
          console.error("Failed to send email notification:", emailError);
          // Don't fail the request if email fails
        }

        res.status(201).json(deviation);
      } catch (error) {
        console.error("Error creating deviation:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // === PATCH /api/deviations/:id - Update deviation ===
  app.patch(
    "/api/deviations/:id",
    authenticateToken,
    requireModule("deviations"),
    validateTenantOwnership,
    enforceTenantIsolation,
    async (req: AuthenticatedRequest, res) => {
      try {
        const tenantId = req.tenantId!;
        const deviationId = parseInt(req.params.id);

        if (isNaN(deviationId)) {
          return res.status(400).json({ message: "Invalid deviation ID" });
        }

        // Parse the update data (allow partial updates)
        const updateData = req.body;
        delete updateData.id; // Don't allow updating ID
        delete updateData.tenantId; // Don't allow updating tenant
        delete updateData.createdAt; // Don't allow updating creation time
        delete updateData.createdByUserId; // Don't allow changing creator

        // Convert dueDate string to Date if provided
        if (updateData.dueDate) {
          updateData.dueDate = new Date(updateData.dueDate);
        }

        // Get original deviation for comparison
        const originalDeviation = await storage.getDeviation(
          deviationId,
          tenantId,
        );
        if (!originalDeviation) {
          return res.status(404).json({ message: "Deviation not found" });
        }

        const userId = req.user?.userId;
        const updatedDeviation = await storage.updateDeviation(
          deviationId,
          updateData,
          tenantId,
          userId,
        );

        const department = updatedDeviation.departmentId
          ? await storage.getDepartment(updatedDeviation.departmentId, tenantId)
          : undefined;

        const status = await storage.getDeviationStatus(
          updatedDeviation.statusId!,
          tenantId,
        );

        // Send email notifications for specific changes
        try {
          console.log("=== EMAIL NOTIFICATION DEBUG ===");
          console.log(
            "Update data received:",
            JSON.stringify(updateData, null, 2),
          );
          console.log(
            "Original deviation:",
            JSON.stringify(
              {
                id: originalDeviation.id,
                statusId: originalDeviation.statusId,
                assignedToUserId: originalDeviation.assignedToUserId,
              },
              null,
              2,
            ),
          );

          const changedBy = await storage.getUserById(userId);
          const type = await storage.getDeviationTypeById(
            updatedDeviation.deviationTypeId,
            tenantId,
          );

          // Check for assignment change
          if (
            updateData.assignedToUserId !== undefined &&
            originalDeviation.assignedToUserId !== updateData.assignedToUserId
          ) {
            console.log("Assignment change detected");
            const assignedUser = await storage.getUserById(
              updateData.assignedToUserId,
            );
            if (assignedUser && changedBy && type) {
              console.log(
                `Sending assignment email to ${assignedUser.email} for deviation ${updatedDeviation.id}`,
              );
              // Transform objects for email templates
              const typeForEmail = {
                name: type.name,
                color: type.color || '#3b82f6'
              };
              const departmentForEmail = department ? {
                name: department.name,
                color: department.color || '#6b7280'
              } : undefined;
              const statusForEmail = status ? {
                name: status.name,
                color: status.color || '#10b981'
              } : undefined;

              await emailService.notifyDeviationAssigned(
                updatedDeviation,
                assignedUser,
                changedBy,
                typeForEmail,
                departmentForEmail,
                statusForEmail,
              );
            }
          }

          // Check for status change - including all possible field names
          const statusChanged =
            (updateData.statusId !== undefined &&
              originalDeviation.statusId !== updateData.statusId) ||
            (updateData.status !== undefined &&
              originalDeviation.statusId !== updateData.status) ||
            (updateData.deviationStatusId !== undefined &&
              originalDeviation.statusId !== updateData.deviationStatusId);

          console.log("Status change check:", {
            updateDataStatusId: updateData.statusId,
            updateDataStatus: updateData.status,
            updateDataDeviationStatusId: updateData.deviationStatusId,
            originalStatusId: originalDeviation.statusId,
            statusChanged,
          });

          if (statusChanged) {
            const newStatusId =
              updateData.statusId ||
              updateData.status ||
              updateData.deviationStatusId;
            console.log(
              `Status change detected: ${originalDeviation.statusId} -> ${newStatusId}`,
            );

            const oldStatus = await storage.getDeviationStatusById(
              originalDeviation.statusId!,
              tenantId,
            );
            const newStatus = await storage.getDeviationStatusById(
              newStatusId,
              tenantId,
            );

            console.log("Status objects:", {
              oldStatus: oldStatus?.name,
              newStatus: newStatus?.name,
            });

            if (oldStatus && newStatus && changedBy && type) {
              // Get users to notify (creator, assigned user, admins)
              const allUsers = await storage.getUsers(tenantId);
              const notifyUsers = allUsers.filter(
                (user) =>
                  user.id === updatedDeviation.createdByUserId ||
                  user.id === updatedDeviation.assignedToUserId ||
                  user.role === "admin" ||
                  user.role === "underadmin",
              );

              // Remove duplicates and exclude the person who made the change
              const uniqueNotifyUsers = notifyUsers.filter(
                (user, index, self) =>
                  user.id !== userId &&
                  index === self.findIndex((u) => u.id === user.id),
              );

              console.log(
                `Sending status change email to ${uniqueNotifyUsers.length} users for deviation ${updatedDeviation.id}`,
              );
              console.log(
                `Recipients: ${uniqueNotifyUsers.map((u) => u.email).join(", ")}`,
              );
              // Transform objects for email templates
              const typeForEmail = {
                name: type.name,
                color: type.color || '#3b82f6'
              };
              const departmentForEmail = department ? {
                name: department.name,
                color: department.color || '#6b7280'
              } : { name: "Okänd avdelning", color: "#6b7280" };
              const statusForEmail = status ? {
                name: status.name,
                color: status.color || '#10b981'
              } : { name: "Okänd status", color: "#6b7280" };

              await emailService.notifyStatusChanged(
                updatedDeviation,
                oldStatus,
                newStatus,
                changedBy,
                typeForEmail,
                departmentForEmail,
                statusForEmail,
                uniqueNotifyUsers,
              );
            } else {
              console.log("Missing data for status change notification:", {
                oldStatus: !!oldStatus,
                newStatus: !!newStatus,
                changedBy: !!changedBy,
                type: !!type,
              });
            }
          } else {
            console.log("No status change detected");
          }

          // Check for general updates (title, description, etc.) - but only if no status change or new assignment
          const assignmentChanged =
            updateData.assignedToUserId !== undefined &&
            originalDeviation.assignedToUserId !== updateData.assignedToUserId;

          const hasGeneralChanges =
            !statusChanged &&
            !assignmentChanged &&
            (updateData.title ||
              updateData.description ||
              updateData.deviationTypeId ||
              updateData.priorityId ||
              updateData.departmentId ||
              updateData.dueDate);

          console.log("General changes check:", {
            hasGeneralChanges,
            statusChanged,
            assignmentChanged,
            title: updateData.title,
            description: updateData.description,
            deviationTypeId: updateData.deviationTypeId,
          });

          if (hasGeneralChanges && changedBy && type) {
            // For general updates, notify creator, assigned user, and department responsible
            const allUsers = await storage.getUsers(tenantId);

            // Get department responsible user if exists
            let departmentResponsibleId = null;
            if (updatedDeviation.departmentId) {
              const department = await storage.getDepartment(
                updatedDeviation.departmentId,
                tenantId,
              );
              departmentResponsibleId = department?.responsibleUserId;
            }

            const notifyUsers = allUsers.filter(
              (user) =>
                (user.id === updatedDeviation.createdByUserId || // Creator
                  user.id === updatedDeviation.assignedToUserId || // Assigned user
                  (departmentResponsibleId &&
                    user.id === departmentResponsibleId)) && // Department responsible
                user.id !== userId, // Don't notify the person making the change
            );

            // If the person making the change is the creator, still notify assigned user and department responsible
            if (userId === updatedDeviation.createdByUserId) {
              const additionalUsers = allUsers.filter(
                (user) =>
                  (user.id === updatedDeviation.assignedToUserId ||
                    (departmentResponsibleId &&
                      user.id === departmentResponsibleId)) &&
                  user.id !== userId,
              );
              notifyUsers.push(...additionalUsers);
            }

            // Remove duplicates
            const uniqueNotifyUsers = notifyUsers.filter(
              (user, index, self) =>
                index === self.findIndex((u) => u.id === user.id),
            );

            console.log("Notification recipients logic:", {
              createdBy: updatedDeviation.createdByUserId,
              assignedTo: updatedDeviation.assignedToUserId,
              departmentResponsible: departmentResponsibleId,
              changedBy: userId,
              filteredUsers: uniqueNotifyUsers.map((u) => ({
                id: u.id,
                email: u.email,
              })),
            });

            if (uniqueNotifyUsers.length > 0) {
              console.log(
                `Sending general update email to ${uniqueNotifyUsers.length} users for deviation ${updatedDeviation.id}`,
              );
              console.log(
                `Recipients: ${uniqueNotifyUsers.map((u) => u.email).join(", ")}`,
              );

              // Transform objects for email templates
              const typeForEmail = {
                name: type.name,
                color: type.color || '#3b82f6'
              };
              const departmentForEmail = department ? {
                name: department.name,
                color: department.color || '#6b7280'
              } : { name: "Okänd avdelning", color: "#6b7280" };
              const statusForEmail = status ? {
                name: status.name,
                color: status.color || '#10b981'
              } : { name: "Okänd status", color: "#6b7280" };

              // Use React Email template for updates
              await emailService.notifyDeviationUpdated(
                updatedDeviation,
                changedBy,
                typeForEmail,
                departmentForEmail,
                statusForEmail,
                uniqueNotifyUsers,
              );
            }
          }

          console.log("=== END EMAIL DEBUG ===");
        } catch (emailError) {
          console.error("Failed to send email notification:", emailError);
        }

        res.json(updatedDeviation);
      } catch (error) {
        console.error("Error updating deviation:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // === DELETE /api/deviations/:id - Delete deviation ===
  app.delete(
    "/api/deviations/:id",
    authenticateToken,
    requireModule("deviations"),
    validateTenantOwnership,
    enforceTenantIsolation,
    async (req: AuthenticatedRequest, res) => {
      try {
        const tenantId = req.tenantId!;
        const deviationId = parseInt(req.params.id);

        if (isNaN(deviationId)) {
          return res.status(400).json({ message: "Invalid deviation ID" });
        }

        await storage.deleteDeviation(deviationId, tenantId);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting deviation:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // === GET /api/deviations/:id/comments - Get deviation comments ===
  app.get(
    "/api/deviations/:id/comments",
    authenticateToken,
    requireModule("deviations"),
    validateTenantOwnership,
    enforceTenantIsolation,
    async (req: AuthenticatedRequest, res) => {
      try {
        const tenantId = req.tenantId!;
        const deviationId = parseInt(req.params.id);

        if (isNaN(deviationId)) {
          return res.status(400).json({ message: "Invalid deviation ID" });
        }

        const comments = await storage.getDeviationComments(
          deviationId,
          tenantId,
        );
        res.json(comments);
      } catch (error) {
        if (error instanceof Error && error.message === "Deviation not found") {
          return res.status(404).json({ message: "Deviation not found" });
        }
        console.error("Error fetching deviation comments:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // === POST /api/deviations/:id/comments - Create deviation comment ===
  app.post(
    "/api/deviations/:id/comments",
    authenticateToken,
    requireModule("deviations"),
    validateTenantOwnership,
    enforceTenantIsolation,
    async (req: AuthenticatedRequest, res) => {
      try {
        const tenantId = req.tenantId!;
        const userId = req.user!.userId;
        const deviationId = parseInt(req.params.id);

        if (isNaN(deviationId)) {
          return res.status(400).json({ message: "Invalid deviation ID" });
        }

        // Verify deviation exists and belongs to tenant
        const deviation = await storage.getDeviation(deviationId, tenantId);
        if (!deviation) {
          return res.status(404).json({ message: "Deviation not found" });
        }
        const department = deviation.departmentId
          ? await storage.getDepartment(deviation.departmentId, tenantId)
          : undefined;

        const status = deviation.statusId
          ? await storage.getDeviationStatus(deviation.statusId, tenantId)
          : undefined;

        const validatedData = insertDeviationCommentSchema.parse({
          ...req.body,
          deviationId,
          userId,
        });

        const comment = await storage.createDeviationComment(validatedData);

        // Send email notifications for new comment
        try {
          const commenter = await storage.getUserById(userId);
          const type = await storage.getDeviationTypeById(
            deviation.deviationTypeId,
            tenantId,
          );

          if (commenter && type) {
            // Get users to notify (creator, assigned user, admins - but not the commenter)
            const allUsers = await storage.getUsers(tenantId);
            const notifyUsers = allUsers.filter(
              (user) =>
                user.id !== userId && // Don't notify the commenter
                (user.id === deviation.createdByUserId ||
                  user.id === deviation.assignedToUserId ||
                  user.role === "admin" ||
                  user.role === "underadmin"),
            );

            console.log(
              `Sending comment email to ${notifyUsers.length} users for deviation ${deviation.id}`,
            );
            console.log(
              `Recipients: ${notifyUsers.map((u) => u.email).join(", ")}`,
            );
            // Transform objects for email templates
            const typeForEmail = {
              name: type.name,
              color: type.color || '#3b82f6'
            };
            const departmentForEmail = department ? {
              name: department.name,
              color: department.color || '#6b7280'
            } : undefined;
            const statusForEmail = status ? {
              name: status.name,
              color: status.color || '#10b981'
            } : undefined;

            await emailService.notifyNewComment(
              deviation,
              req.body.comment,
              commenter,
              typeForEmail,
              notifyUsers,
              departmentForEmail,
              statusForEmail,
            );
          }
        } catch (emailError) {
          console.error("Failed to send email notification:", emailError);
        }

        res.status(201).json(comment);
      } catch (error) {
        console.error("Error creating deviation comment:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // === DELETE /api/deviations/:id/comments/:commentId - Delete deviation comment ===
  app.delete(
    "/api/deviations/:id/comments/:commentId",
    authenticateToken,
    requireModule("deviations"),
    validateTenantOwnership,
    enforceTenantIsolation,
    async (req: AuthenticatedRequest, res) => {
      try {
        const tenantId = req.tenantId!;
        const commentId = parseInt(req.params.commentId);

        if (isNaN(commentId)) {
          return res.status(400).json({ message: "Invalid comment ID" });
        }

        await storage.deleteDeviationComment(commentId, tenantId);
        res.status(204).send();
      } catch (error) {
        if (
          error instanceof Error &&
          (error.message === "Comment not found" ||
            error.message === "Deviation not found")
        ) {
          return res.status(404).json({ message: error.message });
        }
        console.error("Error deleting deviation comment:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  return app;
}
