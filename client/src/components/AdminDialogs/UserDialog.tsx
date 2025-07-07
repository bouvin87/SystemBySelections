// components/UserDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Save, Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { FloatingInput } from "../ui/floatingInput";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  openDialog: () => void;
  editingItem: any;
  setEditingItem: (item: any) => void;
  setDialogOpen: (open: boolean) => void;
  handleSubmit: (url: string, data: any) => void;
  updateUserRoles: (userId: number, roles: string[]) => Promise<void>;
  updateUserDepartments: (
    userId: number,
    departments: string[],
  ) => Promise<void>;
  roles: any[];
  departments: any[];
  selectedUserRoles: string[];
  setSelectedUserRoles: (roles: string[]) => void;
  selectedUserDepartments: string[];
  setSelectedUserDepartments: (departments: string[]) => void;
}

export default function UserDialog({
  open,
  onOpenChange,
  openDialog,
  editingItem,
  setEditingItem,
  setDialogOpen,
  handleSubmit,
  updateUserRoles,
  updateUserDepartments,
  roles,
  departments,
  selectedUserRoles,
  setSelectedUserRoles,
  selectedUserDepartments,
  setSelectedUserDepartments,
}: UserDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={openDialog}>
          <Plus className="mr-2 h-4 w-4" />
          {t("admin.add")} {t("common.user").toLowerCase()}
        </Button>
      </DialogTrigger>
      <DialogContent>
        {isLoading && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-3">
              <svg
                className="animate-spin h-5 w-5 text-primary"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              <span className="text-sm font-medium text-muted-foreground">
                Sparar användaren...
              </span>
            </div>
          </div>
        )}
        <DialogHeader>
          <DialogTitle>
            {editingItem ? "Redigera användare" : "Lägg till användare"}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            setIsLoading(true);
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const roleValue = formData.get("role");
            const role =
              editingItem?.lockRole && editingItem?.role
                ? editingItem.role
                : roleValue === "admin" || roleValue === "user"
                  ? roleValue
                  : "user";

            const data = {
              email: formData.get("email"),
              firstName: formData.get("firstName") || undefined,
              lastName: formData.get("lastName") || undefined,
              role,
              password: formData.get("password") as string,
              isActive: formData.get("isActive") === "on",
            };

            if (editingItem) {
              try {
                await apiRequest("PATCH", `/api/users/${editingItem.id}`, data);
                await updateUserRoles(editingItem.id, selectedUserRoles);
                await updateUserDepartments(editingItem.id, selectedUserDepartments);

                setEditingItem(null);
                setDialogOpen(false);
                setIsLoading(false);
                toast({
                  title: "Framgång!",
                  description: "Användare uppdaterad.",
                });
              } catch (error) {
                setIsLoading(false);
                toast({
                  title: "Fel",
                  description: "Kunde inte uppdatera användaren.",
                  variant: "destructive",
                });
              }
            } else {
              handleSubmit("/api/users", data);
              setIsLoading(false);
            }
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={editingItem?.email || ""}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="firstName">Förnamn</Label>
              <Input
                id="firstName"
                name="firstName"
                defaultValue={editingItem?.firstName || ""}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Efternamn</Label>
              <Input
                id="lastName"
                name="lastName"
                defaultValue={editingItem?.lastName || ""}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Användar roll</Label>
              <Select
                name="role"
                defaultValue={editingItem?.role || "user"}
                disabled={editingItem?.lockRole}
              >
                <SelectTrigger
                  className={
                    editingItem?.lockRole ? "opacity-50 cursor-not-allowed" : ""
                  }
                >
                  <SelectValue placeholder="Välj användar roll" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Användare</SelectItem>
                  <SelectItem value="admin">Administratör</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editingItem?.lockRole && (
              <p className="text-xs text-red-600 mt-1">
                Rollen är låst och kan inte ändras
              </p>
            )}

            {/*Tilldelade roller*/}
            {editingItem && (
              <div>
                <Label>Tilldelade roller</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (!selectedUserRoles.includes(value)) {
                      setSelectedUserRoles((prev) => [...prev, value]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Välj roller" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles
                      .filter((r) => !selectedUserRoles.includes(r.id))
                      .map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}{" "}
                          {r.description && (
                            <span className="text-xs text-muted-foreground">
                              {" "}
                              - {r.description}
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    {roles.filter((r) => !selectedUserRoles.includes(r.id))
                      .length === 0 && (
                      <SelectItem value="no-options" disabled>
                        Alla roller är redan valda
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedUserRoles.map((roleId) => {
                    const role = roles.find((r) => r.id === roleId);
                    return role ? (
                      <div
                        key={roleId}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm flex items-center gap-1"
                      >
                        {role.name}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() =>
                            setSelectedUserRoles((prev) =>
                              prev.filter((id) => id !== roleId),
                            )
                          }
                        />
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
            {/*Avdelningar*/}
            {editingItem && (
              <div>
                <Label>Avdelningar</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (!selectedUserDepartments.includes(value)) {
                      setSelectedUserDepartments((prev) => [...prev, value]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Välj avdelningar" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments
                      .filter((r) => !selectedUserDepartments.includes(r.id.toString()))
                      .map((r) => (
                        <SelectItem key={r.id} value={r.id.toString()}>
                          {r.name}
                          
                        </SelectItem>
                      ))}
                    {departments.filter(
                      (r) => !selectedUserDepartments.includes(r.id.toString()),
                    ).length === 0 && (
                      <SelectItem value="no-options" disabled>
                        Alla avdelningar är redan valda
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedUserDepartments.map((departmentId) => {
                    const department = departments.find(
                      (r) => r.id.toString() === departmentId,
                    );
                    return department ? (
                      <div
                        key={departmentId}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm flex items-center gap-1"
                      >
                        {department.name}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() =>
                            setSelectedUserDepartments((prev) =>
                              prev.filter((id) => id !== departmentId),
                            )
                          }
                        />
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                name="isActive"
                defaultChecked={editingItem?.isActive ?? true}
              />
              <Label htmlFor="isActive">Användaren är aktiv</Label>
            </div>

            {!editingItem && (
              <div>
                <Label htmlFor="password">Lösenord</Label>
                <Input id="password" name="password" type="password" required />
              </div>
            )}

            <Button type="submit" className="w-full">
              <Save className="mr-2 h-4 w-4" />
              Spara
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
