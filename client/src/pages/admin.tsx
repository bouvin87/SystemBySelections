import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  Settings,
  Users,
  ClipboardList,
  Database,
  AlertTriangle,
  X,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { CustomFieldsList } from "@/components/CustomFieldsList";
import IconPicker from "@/components/IconPicker";
import { renderIcon } from "@/lib/icon-utils";
import LanguageSelector from "@/components/LanguageSelector";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  Checklist,
  InsertChecklist,
  WorkTask,
  InsertWorkTask,
  WorkStation,
  InsertWorkStation,
  Shift,
  InsertShift,
  Category,
  InsertCategory,
  Question,
  InsertQuestion,
  User,
  CreateUserRequest,
  Role,
  InsertRole,
  Department,
  InsertDepartment,
} from "@shared/schema";
import { z } from "zod";
import Navigation from "@/components/Navigation";
import ChecklistDialog from "@/components/AdminDialogs/CheckListDialog";
import WorkTaskDialog from "@/components/AdminDialogs/WorkTaskDialog";
import WorkStationDialog from "@/components/AdminDialogs/WorkStationDialog";
import ShiftDialog from "@/components/AdminDialogs/ShiftDialog";
import DepartmentDialog from "@/components/AdminDialogs/DepartmentDialog";
import RoleDialog from "@/components/AdminDialogs/RoleDialog";
import { error } from "console";
import UserDialog from "@/components/AdminDialogs/UserDialog";

// Deviation Settings Component
function DeviationSettingsTab() {
  const { toast } = useToast();

  const { data: deviationSettings } = useQuery<any>({
    queryKey: ["/api/deviations/settings"],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", "/api/deviations/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deviations/settings"] });
      toast({
        title: "Sparat!",
        description: "Inställningarna har uppdaterats.",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte spara inställningarna.",
        variant: "destructive",
      });
    },
  });

  const handleSettingChange = (key: string, value: boolean) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Grundinställningar för avvikelser
        </CardTitle>
        <CardDescription>
          Konfigurera hur avvikelsemodulen fungerar i systemet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="showCreateButton"
            checked={deviationSettings?.showCreateButtonInMenu || false}
            onCheckedChange={(checked) =>
              handleSettingChange("showCreateButtonInMenu", checked as boolean)
            }
          />
          <Label
            htmlFor="showCreateButton"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Visa "Skapa avvikelse"-knapp i menyn
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="useWorkTasks"
            checked={deviationSettings?.useWorkTasks ?? true}
            onCheckedChange={(checked) =>
              handleSettingChange("useWorkTasks", checked as boolean)
            }
          />
          <Label
            htmlFor="useWorkTasks"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Använd arbetsmoment
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="useWorkStations"
            checked={deviationSettings?.useWorkStations ?? true}
            onCheckedChange={(checked) =>
              handleSettingChange("useWorkStations", checked as boolean)
            }
          />
          <Label
            htmlFor="useWorkStations"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Använd arbetsstationer
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="usePriorities"
            checked={deviationSettings?.usePriorities ?? true}
            onCheckedChange={(checked) =>
              handleSettingChange("usePriorities", checked as boolean)
            }
          />
          <Label
            htmlFor="usePriorities"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Använd prioritet
          </Label>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          När aktiverad visas en snabbknapp för att skapa avvikelser direkt från
          huvudmenyn.
        </p>
      </CardContent>
    </Card>
  );
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState("users");
  const [basicDataTab, setBasicDataTab] = useState("work-tasks");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedIcon, setSelectedIcon] = useState<string>("");
  const [selectedChecklistId, setSelectedChecklistId] = useState<number | null>(
    null,
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [selectedWorkTaskIds, setSelectedWorkTaskIds] = useState<number[]>([]);
  const [selectedUserRoles, setSelectedUserRoles] = useState<string[]>([]);
  const [selectedUserDepartments, setSelectedUserDepartments] = useState<
    string[]
  >([]);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Load existing user roles when editing
  useEffect(() => {
    if (editingItem?.roles) {
      const roleIds = editingItem.roles.map((ur: any) => ur.roleId);
      setSelectedUserRoles(roleIds);
    } else {
      setSelectedUserRoles([]);
    }
  }, [editingItem]);

  // Fetch user data to check module access
  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  // Check if user has access to checklists module
  const hasChecklistsModule =
    authData?.tenant?.modules?.includes("checklists") ?? false;

  // Check if user has access to deviations module
  const hasDeviationsModule =
    authData?.tenant?.modules?.includes("deviations") ?? false;

  // Redirect non-admin users to dashboard
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      toast({
        title: "Åtkomst nekad",
        description:
          "Du har inte behörighet att komma åt administratörspanelen.",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [user, isLoading, setLocation, toast]);

  // Set default tab based on module access
  useEffect(() => {
    if (!hasChecklistsModule && activeTab === "checklists") {
      setActiveTab("basic-data");
    }
  }, [hasChecklistsModule, activeTab]);

  // Show loading or nothing while checking authorization
  if (isLoading || !user || user.role !== "admin") {
    return null;
  }

  // Queries
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: activeTab === "users",
  });

  const { data: checklists = [] } = useQuery<Checklist[]>({
    queryKey: ["/api/checklists"],
    enabled: activeTab === "checklists",
  });

  const { data: workTasks = [] } = useQuery<WorkTask[]>({
    queryKey: ["/api/work-tasks"],
    enabled: activeTab === "basic-data" || activeTab === "checklists",
  });

  // Hämta arbetsmoment för en specifik checklista
  const { data: checklistWorkTasks = [], refetch: refetchWorkTasks } = useQuery(
    {
      queryKey: [`/api/checklists/${editingItem?.id}/work-tasks`],
      enabled: !!editingItem?.id,
      staleTime: 0, // Always refetch
      gcTime: 0, // Don't cache (TanStack Query v5)
    },
  );

  // Update selected work task IDs when editing a checklist
  useEffect(() => {
    if (
      editingItem?.id &&
      Array.isArray(checklistWorkTasks) &&
      checklistWorkTasks.length > 0
    ) {
      const workTaskIds = checklistWorkTasks.map((wt: any) => wt.workTaskId);
      setSelectedWorkTaskIds(workTaskIds);
    } else if (!editingItem) {
      setSelectedWorkTaskIds([]);
    }
  }, [editingItem?.id, JSON.stringify(checklistWorkTasks)]);

  const { data: workStations = [] } = useQuery<WorkStation[]>({
    queryKey: ["/api/work-stations"],
    enabled: activeTab === "basic-data",
  });

  const { data: shifts = [] } = useQuery<Shift[]>({
    queryKey: ["/api/shifts"],
    enabled: activeTab === "basic-data",
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
    enabled: activeTab === "basic-data" || activeTab === "users",
  });

  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
    enabled: activeTab === "basic-data" || activeTab === "users",
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories", selectedChecklistId],
    enabled: selectedChecklistId !== null,
  });

  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: ["/api/questions", selectedCategoryId],
    enabled: selectedCategoryId !== null,
  });

  // Deviation types query
  const { data: deviationTypes = [] } = useQuery<any[]>({
    queryKey: ["/api/deviations/types"],
    enabled: activeTab === "deviations",
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async ({ endpoint, data }: { endpoint: string; data: any }) => {
      return apiRequest("POST", endpoint, data);
    },
    onSuccess: (_, { endpoint }) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklists/active"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/checklists/all-active"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/work-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-stations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });

      setDialogOpen(false);
      setEditingItem(null);
      setSelectedIcon("");
      toast({ title: "Sparat!", description: "Objektet har skapats." });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte spara objektet.",
        variant: "destructive",
      });
    },
  });

  const updateUserRoles = async (userId: number, selectedRoles: string[]) => {
    try {
      // Get current user roles
      const currentRoles = editingItem?.roles || [];
      const currentRoleIds = currentRoles.map((ur: any) => ur.roleId);

      // Find roles to add
      const rolesToAdd = selectedRoles.filter(
        (roleId) => !currentRoleIds.includes(roleId),
      );

      // Find roles to remove
      const rolesToRemove = currentRoleIds.filter(
        (roleId: string) => !selectedRoles.includes(roleId),
      );

      // Add new roles
      for (const roleId of rolesToAdd) {
        await apiRequest("POST", "/api/user-roles", { userId, roleId });
      }

      // Remove old roles
      for (const roleId of rolesToRemove) {
        const userRole = currentRoles.find((ur: any) => ur.roleId === roleId);
        if (userRole) {
          await apiRequest("DELETE", `/api/user-roles/${userRole.id}`);
        }
      }

      // Refresh users list
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera användarroller.",
        variant: "destructive",
      });
    }
  };

  const updateUserDepartments = async (
    userId: number,
    selectedDepartments: string[],
  ) => {
    try {
      console.log('updateUserDepartments called with:', { userId, selectedDepartments });
      // Get current user departments
      const currentDepartments = editingItem?.departments || [];
      const currentDepartmentIds = currentDepartments.map(
        (ur: any) => ur.departmentId.toString(),
      );
      console.log('Current department IDs:', currentDepartmentIds);

      // Find departments to add
      const departmentsToAdd = selectedDepartments.filter(
        (departmentId) => !currentDepartmentIds.includes(departmentId),
      );

      // Find departments to remove
      const departmentsToRemove = currentDepartmentIds.filter(
        (departmentId: string) => !selectedDepartments.includes(departmentId),
      );

      console.log('Departments to add:', departmentsToAdd);
      console.log('Departments to remove:', departmentsToRemove);

      // Add new departments
      for (const departmentId of departmentsToAdd) {
        await apiRequest("POST", "/api/user-departments", {
          userId,
          departmentId: parseInt(departmentId),
        });
      }

      // Remove old departments
      for (const departmentId of departmentsToRemove) {
        const userDepartment = currentDepartments.find(
          (ur: any) => ur.departmentId.toString() === departmentId,
        );
        console.log('Trying to remove department:', departmentId, 'Found userDepartment:', userDepartment);
        if (userDepartment) {
          console.log('Deleting user-department:', userDepartment.id);
          await apiRequest(
            "DELETE",
            `/api/user-departments/${userDepartment.id}`,
          );
        }
      }

      // Refresh users list
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera avdelningar.",
        variant: "destructive",
      });
    }
  };

  const updateMutation = useMutation({
    mutationFn: async ({
      endpoint,
      id,
      data,
    }: {
      endpoint: string;
      id: number | string;
      data: any;
    }) => {
      return apiRequest("PATCH", `${endpoint}/${id}`, data);
    },
    onSuccess: (_, { endpoint }) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklists/active"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/checklists/all-active"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/work-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-stations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deviations/types"] });
      setDialogOpen(false);
      setEditingItem(null);
      setSelectedIcon("");
      toast({ title: "Uppdaterat!", description: "Objektet har uppdaterats." });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera objektet.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({
      endpoint,
      id,
    }: {
      endpoint: string;
      id: number | string;
    }) => {
      return apiRequest("DELETE", `${endpoint}/${id}`);
    },
    onSuccess: (_, { endpoint }) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklists/active"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/checklists/all-active"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/work-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-stations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deviations/types"] });
      toast({ title: "Borttaget!", description: "Objektet har tagits bort." });
    },
    onError: (error: any) => {
      const message = error.message;

      if (
        message.includes(
          "Rollen är kopplad till en eller flera användare och kan inte tas bort",
        )
      ) {
        toast({
          title: "Fel",
          description:
            "Denna roll används av en eller flera användare och kan därför inte tas bort.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Fel",
          description: "Kunde inte ta bort objektet." + message,
          variant: "destructive",
        });
      }

      console.error("Error deleting role:", error);
    },
  });

  const openDialog = async (item?: any) => {
    setEditingItem(item);
    setSelectedIcon(item?.icon || "");
    setSelectedWorkTaskIds([]); // Reset first, will be loaded by useEffect

    // Load existing user roles if editing a user
    if (item?.roles) {
      setSelectedUserRoles(item.roles.map((ur: any) => ur.roleId));
    } else {
      setSelectedUserRoles([]);
    }

    // Load existing user departments if editing a user
    if (item?.departments) {
      console.log('Loading user departments:', item.departments);
      setSelectedUserDepartments(item.departments.map((ud: any) => ud.departmentId.toString()));
    } else {
      console.log('No departments found for user');
      setSelectedUserDepartments([]);
    }

    setDialogOpen(true);

    // Force refetch of work tasks if editing an item
    if (item?.id) {
      setTimeout(() => {
        refetchWorkTasks();
      }, 100);
    }
  };

  const handleSubmit = (endpoint: string, data: any) => {
    if (editingItem) {
      updateMutation.mutate({ endpoint, id: editingItem.id, data });
    } else {
      createMutation.mutate({ endpoint, data });
    }
  };

  const handleDelete = (endpoint: string, id: number | string) => {
    if (confirm(t("admin.confirmDelete"))) {
      deleteMutation.mutate({ endpoint, id });
    }
  };
  const handleChecklistSubmit = async (formData: FormData) => {
    const rawWorkTaskIds = formData.get("workTaskIds") as string | null;
    const parsedWorkTaskIds = rawWorkTaskIds ? JSON.parse(rawWorkTaskIds) : [];
    const data = {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      icon: (formData.get("icon") as string) || undefined,
      includeWorkTasks: parsedWorkTaskIds.length > 0,
      includeWorkStations: formData.get("includeWorkStations") === "on",
      includeShifts: formData.get("includeShifts") === "on",
      isActive: formData.get("isActive") === "on",
      showInMenu: formData.get("showInMenu") === "on",
      hasDashboard: formData.get("hasDashboard") === "on",
      order: parseInt(formData.get("order") as string) || 0,
      workTaskIds: parsedWorkTaskIds,
    };

    try {
      let checklistId;

      if (editingItem) {
        await apiRequest("PATCH", `/api/checklists/${editingItem.id}`, data);
        checklistId = editingItem.id;
      } else {
        const response = await apiRequest("POST", "/api/checklists", data);
        const result = await response.json();
        checklistId = result.id;
      }

      // Always update work tasks (to handle both adding and removing)
      if (checklistId) {
        // First remove all existing work tasks
        await apiRequest("DELETE", `/api/checklists/${checklistId}/work-tasks`);
        
        // Then add the selected work tasks
        for (const workTaskId of selectedWorkTaskIds) {
          await apiRequest(
            "POST",
            `/api/checklists/${checklistId}/work-tasks`,
            {
              workTaskId,
            },
          );
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/checklists"] });
      queryClient.invalidateQueries({ queryKey: [`/api/checklists/${checklistId}/work-tasks`] });

      toast({
        title: editingItem ? "Checklista uppdaterad" : "Checklista skapad",
        description: "Checklistan har sparats framgångsrikt.",
      });

      setDialogOpen(false);
      setEditingItem(null);
      setSelectedIcon("");
      setSelectedWorkTaskIds([]);
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte spara checklistan. Försök igen.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Navigation />
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="flex h-auto flex-wrap">
                <TabsTrigger value="settings">
                  {t("admin.settings")}
                </TabsTrigger>
                <TabsTrigger value="users">Användare</TabsTrigger>

                <TabsTrigger value="basic-data">
                  {t("admin.basicData")}
                </TabsTrigger>
                {hasChecklistsModule && (
                  <TabsTrigger value="checklists">
                    {t("admin.checklists")}
                  </TabsTrigger>
                )}
                {hasDeviationsModule && (
                  <TabsTrigger value="deviations">Avvikelser</TabsTrigger>
                )}
              </TabsList>

              {/* Users Tab */}
              <TabsContent value="users">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <h3 className="text-lg font-medium">Hantera användare</h3>
                  <UserDialog
                    open={dialogOpen && activeTab === "users"}
                    onOpenChange={setDialogOpen}
                    openDialog={() => openDialog()}
                    editingItem={editingItem}
                    setEditingItem={setEditingItem}
                    setDialogOpen={setDialogOpen}
                    handleSubmit={handleSubmit}
                    updateUserRoles={updateUserRoles}
                    updateUserDepartments={updateUserDepartments}
                    roles={roles}
                    departments={departments}
                    selectedUserRoles={selectedUserRoles}
                    setSelectedUserRoles={setSelectedUserRoles}
                    selectedUserDepartments={selectedUserDepartments}
                    setSelectedUserDepartments={setSelectedUserDepartments}
                  />
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Namn</TableHead>
                        <TableHead>E-post</TableHead>
                        <TableHead>Roll</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Skapad</TableHead>
                        <TableHead className="w-[100px]">Åtgärder</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((userItem) => (
                        <TableRow key={userItem.id}>
                          <TableCell>
                            {userItem.firstName} {userItem.lastName}
                          </TableCell>
                          <TableCell>{userItem.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                userItem.role === "admin"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {userItem.role === "admin"
                                ? "Administratör"
                                : "Användare"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                userItem.isActive ? "default" : "destructive"
                              }
                            >
                              {userItem.isActive ? "Aktiv" : "Inaktiv"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {userItem.createdAt
                              ? new Date(userItem.createdAt).toLocaleDateString(
                                  "sv-SE",
                                )
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2 self-end sm:self-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDialog(userItem)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {userItem.id !== user?.id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleDelete("/api/users", userItem.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {users.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center text-gray-500"
                          >
                            Inga användare hittades
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Checklists Tab */}
              {hasChecklistsModule && (
                <TabsContent value="checklists">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <h3 className="text-lg font-medium">
                      {t("admin.manage")} {t("admin.checklists").toLowerCase()}
                    </h3>
                    <Button onClick={() => openDialog()}>
                      <Plus className="mr-2 h-4 w-4" />
                      {t("admin.add")} {t("admin.checklist").toLowerCase()}
                    </Button>
                    <ChecklistDialog
                      open={dialogOpen && activeTab === "checklists"}
                      onClose={() => setDialogOpen(false)}
                      editingItem={editingItem}
                      selectedIcon={selectedIcon}
                      setSelectedIcon={setSelectedIcon}
                      selectedWorkTaskIds={selectedWorkTaskIds}
                      setSelectedWorkTaskIds={setSelectedWorkTaskIds}
                      workTasks={workTasks}
                      handleSubmit={handleChecklistSubmit}
                    />
                  </div>

                  <div className="space-y-4">
                    {checklists.map((checklist) => (
                      <Card
                        key={checklist.id}
                        className="bg-card border border-border shadow-sm rounded-2xl"
                      >
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {renderIcon(
                                  checklist.icon,
                                  "h-4 w-4 text-gray-600",
                                )}
                                <h4 className="text-sm font-medium text-gray-900">
                                  {checklist.name}
                                </h4>
                              </div>
                              {checklist.description && (
                                <p className="text-sm text-gray-600">
                                  {checklist.description}
                                </p>
                              )}
                              <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                                <Badge
                                  variant={
                                    checklist.isActive ? "default" : "secondary"
                                  }
                                >
                                  {checklist.isActive
                                    ? t("admin.active")
                                    : t("admin.inactive")}
                                </Badge>
                                {checklist.includeWorkTasks && (
                                  <span>{t("admin.workTasks")}</span>
                                )}
                                {checklist.includeWorkStations && (
                                  <span>{t("admin.workStations")}</span>
                                )}
                                {checklist.includeShifts && (
                                  <span>{t("admin.shifts")}</span>
                                )}
                              </div>
                            </div>
                            <div className="w-full flex justify-between items-center flex-wrap gap-2 mt-4">
                              {/* Vänster: Hantera kategorier */}
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/checklist-editor/${checklist.id}`}>
                                  <Settings className="mr-1 h-3 w-3" />
                                  Kategorier
                                </Link>
                              </Button>

                              {/* Höger: Redigera + Ta bort */}
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDialog(checklist)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete("/api/checklists", checklist.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              )}

              {/* Basic Data Tab */}
              <TabsContent value="basic-data">
                <Tabs value={basicDataTab} onValueChange={setBasicDataTab}>
                  <TabsList className="grid w-full h-auto grid-cols-2 md:grid-cols-5">
                    <TabsTrigger value="work-tasks">
                      {t("admin.workTasks")}
                    </TabsTrigger>
                    <TabsTrigger value="work-stations">
                      {t("admin.workStations")}
                    </TabsTrigger>
                    <TabsTrigger value="shifts">
                      {t("admin.shifts")}
                    </TabsTrigger>
                    <TabsTrigger value="departments">Avdelningar</TabsTrigger>
                    <TabsTrigger value="roles">Roller</TabsTrigger>
                  </TabsList>

                  {/* Work Tasks Tab */}
                  <TabsContent value="work-tasks">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                      <h3 className="text-lg font-medium">
                        {t("admin.manage")} {t("admin.workTasks").toLowerCase()}
                      </h3>
                      <Button onClick={() => openDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t("admin.add")} {t("admin.workTask").toLowerCase()}
                      </Button>
                      <WorkTaskDialog
                        open={
                          dialogOpen &&
                          activeTab === "basic-data" &&
                          basicDataTab === "work-tasks"
                        }
                        onClose={() => setDialogOpen(false)}
                        editingItem={editingItem}
                        handleSubmit={(data) => {
                          handleSubmit("/api/work-tasks", data);
                        }}
                      />
                    </div>

                    <div className="space-y-4">
                      {workTasks.map((task) => (
                        <Card
                          key={task.id}
                          className="bg-card border border-border shadow-sm rounded-2xl"
                        >
                          <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-900">
                                  {task.name}
                                </h4>
                                <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                                  {task.hasStations && (
                                    <Badge variant="outline">
                                      {t("admin.hasStations")}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex space-x-2 self-end sm:self-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDialog(task)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleDelete("/api/work-tasks", task.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Work Stations Tab */}
                  <TabsContent value="work-stations">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                      <h3 className="text-lg font-medium">
                        {t("admin.manage")}{" "}
                        {t("admin.workStations").toLowerCase()}
                      </h3>
                      <Button onClick={() => openDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t("admin.add")} {t("admin.workStation").toLowerCase()}
                      </Button>
                      <WorkStationDialog
                        open={
                          dialogOpen &&
                          activeTab === "basic-data" &&
                          basicDataTab === "work-stations"
                        }
                        onClose={() => setDialogOpen(false)}
                        editingItem={editingItem}
                        workTasks={workTasks}
                        handleSubmit={(data) =>
                          handleSubmit("/api/work-stations", data)
                        }
                      />
                    </div>
                    <div className="space-y-4">
                      {workStations.map((station) => (
                        <Card
                          key={station.id}
                          className="bg-card border border-border shadow-sm rounded-2xl"
                        >
                          <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-900">
                                  {station.name}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {t("admin.workTask")}:{" "}
                                  {workTasks.find(
                                    (t) => t.id === station.workTaskId,
                                  )?.name || t("common.unknown")}
                                </p>
                              </div>
                              <div className="flex space-x-2 self-end sm:self-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDialog(station)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleDelete(
                                      "/api/work-stations",
                                      station.id,
                                    )
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Shifts Tab */}
                  <TabsContent value="shifts">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                      <h3 className="text-lg font-medium">
                        {t("admin.manage")} {t("admin.shifts").toLowerCase()}
                      </h3>
                      <Button onClick={() => openDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t("admin.add")} {t("admin.shift").toLowerCase()}
                      </Button>
                      <ShiftDialog
                        open={
                          dialogOpen &&
                          activeTab === "basic-data" &&
                          basicDataTab === "shifts"
                        }
                        onClose={() => setDialogOpen(false)}
                        editingItem={editingItem}
                        handleSubmit={(data) =>
                          handleSubmit("/api/shifts", data)
                        }
                      />
                    </div>

                    <div className="space-y-4">
                      {shifts.map((shift) => (
                        <Card
                          key={shift.id}
                          className="bg-card border border-border shadow-sm rounded-2xl"
                        >
                          <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-900">
                                  {shift.name}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {shift.startTime} - {shift.endTime}
                                </p>
                                <div className="mt-2">
                                  <Badge
                                    variant={
                                      shift.isActive ? "default" : "secondary"
                                    }
                                  >
                                    {shift.isActive ? "Aktiv" : "Inaktiv"}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex space-x-2 self-end sm:self-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDialog(shift)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleDelete("/api/shifts", shift.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Departments Tab */}
                  <TabsContent value="departments">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                      <h3 className="text-lg font-medium">
                        Hantera avdelningar
                      </h3>
                      <Button onClick={() => openDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Lägg till avdelning
                      </Button>
                      <DepartmentDialog
                        open={
                          dialogOpen &&
                          activeTab === "basic-data" &&
                          basicDataTab === "departments"
                        }
                        onClose={() => setDialogOpen(false)}
                        editingItem={editingItem}
                        users={users}
                        handleSubmit={(data) =>
                          handleSubmit("/api/departments", data)
                        }
                      />
                    </div>

                    <div className="space-y-4">
                      {departments.map((department) => (
                        <Card
                          key={department.id}
                          className="bg-card border border-border shadow-sm rounded-2xl"
                        >
                          <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <div className="flex items-center space-x-3 flex-1">
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: department.color }}
                                />
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium text-gray-900">
                                    {department.name}
                                  </h4>
                                  {department.description && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      {department.description}
                                    </p>
                                  )}
                                  <div className="mt-2 space-y-1">
                                    <Badge
                                      variant={
                                        department.isActive
                                          ? "default"
                                          : "secondary"
                                      }
                                    >
                                      {department.isActive
                                        ? "Aktiv"
                                        : "Inaktiv"}
                                    </Badge>
                                    {department.responsibleUserId && (
                                      <p className="text-xs text-gray-500">
                                        Ansvarig:{" "}
                                        {
                                          users.find(
                                            (u) =>
                                              u.id ===
                                              department.responsibleUserId,
                                          )?.firstName
                                        }{" "}
                                        {
                                          users.find(
                                            (u) =>
                                              u.id ===
                                              department.responsibleUserId,
                                          )?.lastName
                                        }
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-2 self-end sm:self-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDialog(department)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleDelete(
                                      "/api/departments",
                                      department.id,
                                    )
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {departments.length === 0 && (
                        <Card>
                          <CardContent className="p-8 text-center text-gray-500">
                            <p>Inga avdelningar skapade än.</p>
                            <p className="text-sm mt-1">
                              Klicka på "Lägg till avdelning" för att komma
                              igång.
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>

                  {/* Roles Tab */}
                  <TabsContent value="roles">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                      <h3 className="text-lg font-medium">Hantera roller</h3>
                      <Button onClick={() => openDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Lägg till roll
                      </Button>
                      <RoleDialog
                        open={
                          dialogOpen &&
                          activeTab === "basic-data" &&
                          basicDataTab === "roles"
                        }
                        onClose={() => setDialogOpen(false)}
                        editingItem={editingItem}
                        handleSubmit={(data) =>
                          handleSubmit("/api/roles", data)
                        }
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {roles.map((role) => (
                        <Card
                          key={role.id}
                          className="bg-card text-foreground border border-border rounded-2xl shadow-xs transition hover:shadow-md"
                        >
                          <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <h4 className="text-sm font-medium">
                                  {role.name}
                                </h4>
                                {role.description && (
                                  <p className="text-sm text-muted-foreground">
                                    {role.description}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  Skapad:{" "}
                                  {new Date(role.createdAt).toLocaleDateString(
                                    "sv-SE",
                                  )}
                                </p>
                              </div>
                              <div className="flex gap-2 self-end sm:self-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDialog(role)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleDelete("/api/roles", role.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {roles.length === 0 && (
                        <Card className="bg-card text-muted-foreground border border-border rounded-2xl shadow-xs text-center">
                          <CardContent className="p-8">
                            <p>Inga roller skapade än.</p>
                            <p className="text-sm mt-1">
                              Klicka på &quot;Lägg till roll&quot; för att komma
                              igång.
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* Deviations Tab */}
              {hasDeviationsModule && (
                <TabsContent value="deviations">
                  <div className="space-y-6">
                    <Tabs defaultValue="settings" className="w-full">
                      <TabsList className="grid w-full h-auto grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                        <TabsTrigger value="settings">
                          Grundinställningar
                        </TabsTrigger>
                        <TabsTrigger value="types">Avvikelsetyper</TabsTrigger>
                        <TabsTrigger value="priorities">
                          Prioriteter
                        </TabsTrigger>
                        <TabsTrigger value="statuses">Statusar</TabsTrigger>
                        <TabsTrigger value="custom-fields">
                          Extrafält
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="settings" className="space-y-6">
                        <DeviationSettingsTab />
                      </TabsContent>

                      <TabsContent value="types" className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Avvikelsetyper
                          </h3>
                          <div></div>
                          <Dialog
                            open={dialogOpen && activeTab === "deviations"}
                            onOpenChange={setDialogOpen}
                          >
                            <DialogTrigger asChild>
                              <Button onClick={() => openDialog()}>
                                <Plus className="mr-2 h-4 w-4" />
                                Lägg till avvikelsetyp
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  {editingItem
                                    ? "Redigera avvikelsetyp"
                                    : "Skapa avvikelsetyp"}
                                </DialogTitle>
                              </DialogHeader>
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  const formData = new FormData(
                                    e.currentTarget,
                                  );
                                  const data = {
                                    name: formData.get("name") as string,
                                    description:
                                      (formData.get("description") as string) ||
                                      undefined,
                                    color:
                                      (formData.get("color") as string) ||
                                      "#ef4444",
                                    isActive: formData.get("isActive") === "on",
                                  };

                                  if (editingItem) {
                                    updateMutation.mutate({
                                      endpoint: "/api/deviations/types",
                                      id: editingItem.id,
                                      data,
                                    });
                                  } else {
                                    createMutation.mutate({
                                      endpoint: "/api/deviations/types",
                                      data,
                                    });
                                  }
                                  setDialogOpen(false);
                                  setEditingItem(null);
                                }}
                                className="space-y-4"
                              >
                                <div>
                                  <Label htmlFor="name">Namn</Label>
                                  <Input
                                    id="name"
                                    name="name"
                                    defaultValue={editingItem?.name || ""}
                                    placeholder="t.ex. Kvalitet, Säkerhet..."
                                    required
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="description">
                                    Beskrivning
                                  </Label>
                                  <Textarea
                                    id="description"
                                    name="description"
                                    defaultValue={
                                      editingItem?.description || ""
                                    }
                                    placeholder="Beskriv vad denna avvikelsetyp omfattar..."
                                    rows={3}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="color">Färg</Label>
                                  <Input
                                    id="color"
                                    name="color"
                                    type="color"
                                    defaultValue={
                                      editingItem?.color || "#ef4444"
                                    }
                                  />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id="isActive"
                                    name="isActive"
                                    defaultChecked={
                                      editingItem?.isActive ?? true
                                    }
                                  />
                                  <Label htmlFor="isActive">Aktiv</Label>
                                </div>
                                <Button type="submit" className="w-full">
                                  <Save className="mr-2 h-4 w-4" />
                                  Spara
                                </Button>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </div>

                        <div className="grid gap-4">
                          {deviationTypes.map((type: any) => (
                            <Card
                              key={type.id}
                              className="bg-card border border-border shadow-sm rounded-2xl"
                            >
                              <CardContent className="p-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                  <div className="flex items-center space-x-3">
                                    <div
                                      className="w-4 h-4 rounded-full"
                                      style={{ backgroundColor: type.color }}
                                    />
                                    <div>
                                      <div className="font-medium">
                                        {type.name}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {type.isActive ? "Aktiv" : "Inaktiv"}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex space-x-2 self-end sm:self-center">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openDialog(type)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleDelete(
                                          "/api/deviations/types",
                                          type.id,
                                        )
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          {deviationTypes.length === 0 && (
                            <Card>
                              <CardContent className="p-8 text-center text-gray-500">
                                <p>Inga avvikelsetyper skapade än.</p>
                                <p className="text-sm mt-1">
                                  Klicka på "Lägg till avvikelsetyp" för att
                                  komma igång.
                                </p>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="priorities" className="space-y-6">
                        <DeviationPrioritiesManagement />
                      </TabsContent>

                      <TabsContent value="statuses" className="space-y-6">
                        <DeviationStatusesManagement />
                      </TabsContent>

                      <TabsContent value="custom-fields" className="space-y-6">
                        <CustomFieldsList />
                      </TabsContent>
                    </Tabs>
                  </div>
                </TabsContent>
              )}

              {/* Settings Tab */}
              <TabsContent value="settings">
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">{t("admin.settings")}</h3>
                  <Card>
                    <CardHeader>
                      <CardTitle>Systeminställningar</CardTitle>
                      <CardDescription>
                        Allmänna inställningar för systemet. Språkinställningar
                        finns nu i användarmenyn.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Inga systemspecifika inställningar tillgängliga för
                        närvarande.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Deviation Priorities Management Component
function DeviationPrioritiesManagement() {
  const {
    data: priorities = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["/api/deviations/priorities"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest({
        endpoint: "/api/deviations/priorities",
        method: "POST",
        data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/deviations/priorities"],
      });
      refetch();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest({
        endpoint: `/api/deviations/priorities/${id}`,
        method: "PATCH",
        data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/deviations/priorities"],
      });
      refetch();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest({
        endpoint: `/api/deviations/priorities/${id}`,
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/deviations/priorities"],
      });
      refetch();
    },
  });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPriority, setEditingPriority] = useState<any>(null);

  const createForm = useForm({
    resolver: zodResolver(
      z.object({
        name: z.string().min(1, "Namn krävs"),
        color: z.string().min(1, "Färg krävs"),
        order: z.number().min(0, "Ordning måste vara 0 eller högre"),
        isActive: z.boolean(),
      }),
    ),
    defaultValues: {
      name: "",
      color: "#ef4444",
      order: 0,
      isActive: true,
    },
  });

  const editForm = useForm({
    resolver: zodResolver(
      z.object({
        name: z.string().min(1, "Namn krävs"),
        color: z.string().min(1, "Färg krävs"),
        order: z.number().min(0, "Ordning måste vara 0 eller högre"),
        isActive: z.boolean(),
      }),
    ),
    defaultValues: {
      name: "",
      color: "#ef4444",
      order: 0,
      isActive: true,
    },
  });

  const onCreateSubmit = (data: any) => {
    createMutation.mutate(data);
    setIsCreateDialogOpen(false);
    createForm.reset();
  };

  const onEditSubmit = (data: any) => {
    if (editingPriority) {
      updateMutation.mutate({ id: editingPriority.id, data });
      setEditingPriority(null);
      editForm.reset();
    }
  };

  const handleEdit = (priority: any) => {
    setEditingPriority(priority);
    editForm.reset({
      name: priority.name,
      color: priority.color,
      order: priority.order,
      isActive: priority.isActive,
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Är du säker på att du vill ta bort denna prioritet?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div>Laddar prioriteter...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Avvikelseprioriteter</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Lägg till prioritet
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Skapa ny prioritet</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form
                onSubmit={createForm.handleSubmit(onCreateSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Namn</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="t.ex. Hög"
                          className="rounded-md border-border focus-visible:ring-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Färg</FormLabel>
                      <FormControl>
                        <Input
                          type="color"
                          {...field}
                          className="rounded-md border-border focus-visible:ring-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordning</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                          className="rounded-md border-border focus-visible:ring-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Aktiv</FormLabel>
                        <FormDescription>
                          Visa denna prioritet i listan
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Avbryt
                  </Button>
                  <Button type="submit">Skapa</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {priorities.map((priority: any) => (
          <Card
            key={priority.id}
            className="bg-card border border-border shadow-sm rounded-2xl"
          >
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: priority.color }}
                  />
                  <div>
                    <div className="font-medium">{priority.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Ordning: {priority.order} •{" "}
                      {priority.isActive ? "Aktiv" : "Inaktiv"}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 self-end sm:self-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(priority)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(priority.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingPriority}
        onOpenChange={() => setEditingPriority(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redigera prioritet</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onEditSubmit)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Namn</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="t.ex. Hög"
                        className="rounded-md border-border focus-visible:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Färg</FormLabel>
                    <FormControl>
                      <Input
                        type="color"
                        {...field}
                        className="rounded-md border-border focus-visible:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordning</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                        className="rounded-md border-border focus-visible:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Aktiv</FormLabel>
                      <FormDescription>
                        Visa denna prioritet i listan
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingPriority(null)}
                >
                  Avbryt
                </Button>
                <Button type="submit">Spara</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Deviation Statuses Management Component
function DeviationStatusesManagement() {
  const {
    data: statuses = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["/api/deviations/statuses"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest({
        endpoint: "/api/deviations/statuses",
        method: "POST",
        data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deviations/statuses"] });
      refetch();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest({
        endpoint: `/api/deviations/statuses/${id}`,
        method: "PATCH",
        data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deviations/statuses"] });
      refetch();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest({
        endpoint: `/api/deviations/statuses/${id}`,
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deviations/statuses"] });
      refetch();
    },
  });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<any>(null);

  const createForm = useForm({
    resolver: zodResolver(
      z.object({
        name: z.string().min(1, "Namn krävs"),
        color: z.string().min(1, "Färg krävs"),
        order: z.number().min(0, "Ordning måste vara 0 eller högre"),
        isActive: z.boolean(),
        isDefault: z.boolean(),
        isCompleted: z.boolean(),
      }),
    ),
    defaultValues: {
      name: "",
      color: "#3b82f6",
      order: 0,
      isActive: true,
      isDefault: false,
      isCompleted: false,
    },
  });

  const editForm = useForm({
    resolver: zodResolver(
      z.object({
        name: z.string().min(1, "Namn krävs"),
        color: z.string().min(1, "Färg krävs"),
        order: z.number().min(0, "Ordning måste vara 0 eller högre"),
        isActive: z.boolean(),
        isDefault: z.boolean(),
        isCompleted: z.boolean(),
      }),
    ),
    defaultValues: {
      name: "",
      color: "#3b82f6",
      order: 0,
      isActive: true,
      isDefault: false,
      isCompleted: false,
    },
  });

  const onCreateSubmit = (data: any) => {
    createMutation.mutate(data);
    setIsCreateDialogOpen(false);
    createForm.reset();
  };

  const onEditSubmit = (data: any) => {
    if (editingStatus) {
      updateMutation.mutate({ id: editingStatus.id, data });
      setEditingStatus(null);
      editForm.reset();
    }
  };

  const handleEdit = (status: any) => {
    setEditingStatus(status);
    editForm.reset({
      name: status.name,
      color: status.color,
      order: status.order,
      isActive: status.isActive,
      isDefault: status.isDefault,
      isCompleted: status.isCompleted || false,
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Är du säker på att du vill ta bort denna status?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div>Laddar statusar...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Avvikelsestatus</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Lägg till status
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Skapa ny status</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form
                onSubmit={createForm.handleSubmit(onCreateSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Namn</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="t.ex. Pågående"
                          className="rounded-md border-border focus-visible:ring-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Färg</FormLabel>
                      <FormControl>
                        <Input
                          type="color"
                          {...field}
                          className="rounded-md border-border focus-visible:ring-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordning</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                          className="rounded-md border-border focus-visible:ring-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Aktiv</FormLabel>
                        <FormDescription>
                          Visa denna status i listan
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Standardstatus
                        </FormLabel>
                        <FormDescription>
                          Använd denna status som standard för nya avvikelser
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="isCompleted"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Är avslutad</FormLabel>
                        <FormDescription>
                          Markera avvikelser med denna status som
                          avslutade/klara
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Avbryt
                  </Button>
                  <Button type="submit">Skapa</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {statuses.map((status: any) => (
          <Card
            key={status.id}
            className="bg-card border border-border shadow-sm rounded-2xl"
          >
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: status.color }}
                  />
                  <div>
                    <div className="font-medium flex items-center space-x-2">
                      <span>{status.name}</span>
                      {status.isDefault && (
                        <Badge variant="secondary">Standard</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Ordning: {status.order} •{" "}
                      {status.isActive ? "Aktiv" : "Inaktiv"} •{" "}
                      {status.isDefault ? "Standard" : "Inte standard"} •{" "}
                      {status.isCompleted ? "Avslutad" : "Pågående"}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 self-end sm:self-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(status)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(status.id)}
                    disabled={status.isDefault}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingStatus}
        onOpenChange={() => setEditingStatus(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redigera status</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onEditSubmit)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Namn</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="t.ex. Pågående"
                        className="rounded-md border-border focus-visible:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Färg</FormLabel>
                    <FormControl>
                      <Input
                        type="color"
                        {...field}
                        className="rounded-md border-border focus-visible:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordning</FormLabel>
                    <FormControl>
                      <Input
                        className="rounded-md border-border focus-visible:ring-primary"
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Aktiv</FormLabel>
                      <FormDescription>
                        Visa denna status i listan
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Standardstatus
                      </FormLabel>
                      <FormDescription>
                        Använd denna status som standard för nya avvikelser
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="isCompleted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Är avslutad</FormLabel>
                      <FormDescription>
                        Markera avvikelser med denna status som avslutade/klara
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingStatus(null)}
                >
                  Avbryt
                </Button>
                <Button type="submit">Spara</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
