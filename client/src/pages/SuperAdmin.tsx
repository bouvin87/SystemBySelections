import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Building2,
  Settings,
  Trash2,
  Edit,
  Users,
  UserPlus,
  Mail,
  Shield,
  Filter,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { Tenant } from "@shared/schema";

const AVAILABLE_MODULES = [
  {
    id: "checklists",
    name: "Checklistor",
    description: "Hantera checklistor och kontroller",
  },
  {
    id: "maintenance",
    name: "Underhåll",
    description: "Underhållsplanering och -uppföljning",
  },
  { id: "analytics", name: "Analys", description: "Rapporter och dataanalys" },
  {
    id: "inventory",
    name: "Lager",
    description: "Lagerhantering och inventering",
  },
];

const AVAILABLE_ROLES = [
  {
    id: "admin",
    name: "Admin",
    description: "Administratörsrättigheter för tenant",
  },
  {
    id: "user",
    name: "Användare",
    description: "Standardanvändare med begränsade rättigheter",
  },
  { id: "viewer", name: "Läsare", description: "Endast läsrättigheter" },
];

export default function SuperAdmin() {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [newTenant, setNewTenant] = useState({
    name: "",
    modules: [] as string[],
  });

  // User management state
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [selectedTenantForUser, setSelectedTenantForUser] = useState<
    number | null
  >(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userFilters, setUserFilters] = useState({
    tenant: "",
    email: "",
    name: "",
    role: "",
  });
  const [newUser, setNewUser] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    role: "user",
    lockRole: false,
  });

  // Fetch all tenants
  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["/api/super-admin/tenants"],
    retry: false,
  });

  // Fetch all users
  const { data: allUsers = [] } = useQuery({
    queryKey: ["/api/super-admin/users"],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/super-admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    },
    retry: false,
  });

  // Filter users based on current filters
  const filteredUsers = allUsers.filter((user: any) => {
    const tenant = (tenants as any[]).find((t: any) => t.id === user.tenantId);
    const tenantName = tenant?.name || "";
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();

    return (
      (!userFilters.tenant ||
        tenantName.toLowerCase().includes(userFilters.tenant.toLowerCase())) &&
      (!userFilters.email ||
        user.email.toLowerCase().includes(userFilters.email.toLowerCase())) &&
      (!userFilters.name ||
        fullName.includes(userFilters.name.toLowerCase())) &&
      (!userFilters.role ||
        user.role.toLowerCase().includes(userFilters.role.toLowerCase()))
    );
  });

  // Create tenant mutation
  const createTenantMutation = useMutation({
    mutationFn: async (tenantData: { name: string; modules: string[] }) => {
      return await apiRequest({
        endpoint: "/api/super-admin/tenants",
        method: "POST",
        data: tenantData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/tenants"] });
      setIsCreateDialogOpen(false);
      setNewTenant({ name: "", modules: [] });
      toast({
        title: "Tenant skapad",
        description: "Den nya tenanten har skapats framgångsrikt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: "Kunde inte skapa tenant: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Update tenant mutation
  const updateTenantMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: { name: string; modules: string[] };
    }) => {
      return await apiRequest({
        endpoint: `/api/super-admin/tenants/${id}`,
        method: "PATCH",
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/tenants"] });
      setEditingTenant(null);
      toast({
        title: "Tenant uppdaterad",
        description: "Tenanten har uppdaterats framgångsrikt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera tenant: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Delete tenant mutation
  const deleteTenantMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest({
        endpoint: `/api/super-admin/tenants/${id}`,
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/tenants"] });
      toast({
        title: "Tenant borttagen",
        description: "Tenanten har tagits bort framgångsrikt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: "Kunde inte ta bort tenant: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: {
      email: string;
      firstName: string;
      lastName: string;
      password: string;
      role: string;
      tenantId: number;
      lockRole: boolean;
    }) => {
      return await apiRequest({
        endpoint: "/api/super-admin/users",
        method: "POST",
        data: userData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/users"] });
      setIsCreateUserDialogOpen(false);
      setNewUser({
        email: "",
        firstName: "",
        lastName: "",
        password: "",
        role: "user",
        lockRole: false,
      });
      toast({
        title: "Användare skapad",
        description: "Den nya användaren har skapats framgångsrikt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: "Kunde inte skapa användare: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: {
      id: number;
      email?: string;
      firstName?: string;
      lastName?: string;
      role?: string;
      lockRole?: boolean;
      isActive?: boolean;
    }) => {
      return await apiRequest({
        endpoint: `/api/super-admin/users/${userData.id}`,
        method: "PATCH",
        data: userData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/users"] });
      setIsEditUserDialogOpen(false);
      setEditingUser(null);
      toast({
        title: "Användare uppdaterad",
        description: "Användarens information har uppdaterats framgångsrikt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera användare: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateTenant = () => {
    if (!newTenant.name.trim()) {
      toast({
        title: "Fel",
        description: "Ange ett namn för tenanten.",
        variant: "destructive",
      });
      return;
    }
    createTenantMutation.mutate(newTenant);
  };

  const handleUpdateTenant = () => {
    if (!editingTenant) return;
    updateTenantMutation.mutate({
      id: editingTenant.id,
      data: {
        name: editingTenant.name,
        modules: editingTenant.modules,
      },
    });
  };

  const handleCreateUser = () => {
    if (!selectedTenantForUser) {
      toast({
        title: "Fel",
        description: "Välj en tenant för användaren.",
        variant: "destructive",
      });
      return;
    }

    if (
      !newUser.email.trim() ||
      !newUser.firstName.trim() ||
      !newUser.lastName.trim() ||
      !newUser.password.trim()
    ) {
      toast({
        title: "Fel",
        description: "Fyll i alla obligatoriska fält.",
        variant: "destructive",
      });
      return;
    }

    createUserMutation.mutate({
      ...newUser,
      tenantId: selectedTenantForUser,
    });
  };

  const handleEditUser = (user: any) => {
    setEditingUser({
      ...user,
      password: "", // Don't pre-fill password for security
    });
    setIsEditUserDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;

    if (
      !editingUser.email.trim() ||
      !editingUser.firstName.trim() ||
      !editingUser.lastName.trim()
    ) {
      toast({
        title: "Fel",
        description: "Fyll i alla obligatoriska fält.",
        variant: "destructive",
      });
      return;
    }

    const updateData: any = {
      id: editingUser.id,
      email: editingUser.email,
      firstName: editingUser.firstName,
      lastName: editingUser.lastName,
      role: editingUser.role,
      lockRole: editingUser.lockRole,
      isActive: editingUser.isActive,
    };

    // Only include password if it's provided
    if (editingUser.password && editingUser.password.trim()) {
      updateData.password = editingUser.password;
    }

    updateUserMutation.mutate(updateData);
  };

  const handleModuleToggle = (
    moduleId: string,
    isChecked: boolean,
    tenant?: Tenant,
  ) => {
    if (tenant) {
      // Editing existing tenant
      const updatedModules = isChecked
        ? [...tenant.modules, moduleId]
        : tenant.modules.filter((m) => m !== moduleId);
      setEditingTenant({ ...tenant, modules: updatedModules });
    } else {
      // Creating new tenant
      const updatedModules = isChecked
        ? [...newTenant.modules, moduleId]
        : newTenant.modules.filter((m) => m !== moduleId);
      setNewTenant({ ...newTenant, modules: updatedModules });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Laddar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  SuperAdmin Panel
                </h1>
                <p className="text-sm text-gray-500">
                  Hantera tenants och systemmoduler
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <div className="text-sm text-gray-600">
                  Inloggad som:{" "}
                  <span className="font-medium">{user.email}</span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logga ut
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="tenants" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tenants" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Tenants
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Användarhantering
            </TabsTrigger>
          </TabsList>

          {/* Tenants Tab */}
          <TabsContent value="tenants" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Tenants ({(tenants as any[]).length})
                </h2>
                <p className="text-sm text-gray-500">
                  Hantera alla tenants i systemet
                </p>
              </div>

              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Skapa Tenant
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Skapa ny tenant</DialogTitle>
                    <DialogDescription>
                      Skapa en ny tenant och välj vilka moduler som ska vara
                      tillgängliga.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="tenant-name">Tenant-namn</Label>
                      <Input
                        id="tenant-name"
                        value={newTenant.name}
                        onChange={(e) =>
                          setNewTenant({ ...newTenant, name: e.target.value })
                        }
                        placeholder="T.ex. Volvo Manufacturing"
                      />
                    </div>

                    <div>
                      <Label>Moduler</Label>
                      <div className="space-y-3 mt-2">
                        {AVAILABLE_MODULES.map((module) => (
                          <div
                            key={module.id}
                            className="flex items-start space-x-3"
                          >
                            <Checkbox
                              id={`module-${module.id}`}
                              checked={newTenant.modules.includes(module.id)}
                              onCheckedChange={(checked) =>
                                handleModuleToggle(
                                  module.id,
                                  checked as boolean,
                                )
                              }
                            />
                            <div className="grid gap-1.5 leading-none">
                              <label
                                htmlFor={`module-${module.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {module.name}
                              </label>
                              <p className="text-xs text-muted-foreground">
                                {module.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Avbryt
                    </Button>
                    <Button
                      onClick={handleCreateTenant}
                      disabled={createTenantMutation.isPending}
                    >
                      {createTenantMutation.isPending
                        ? "Skapar..."
                        : "Skapa Tenant"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Tenants Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {(tenants as any[]).map((tenant: Tenant) => (
                <Card
                  key={tenant.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">{tenant.name}</CardTitle>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTenant(tenant)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (
                            confirm(
                              "Är du säker på att du vill ta bort denna tenant?",
                            )
                          ) {
                            deleteTenantMutation.mutate(tenant.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">ID: {tenant.id}</p>
                        <p className="text-sm text-gray-500">
                          Skapad:{" "}
                          {new Date(tenant.createdAt).toLocaleDateString(
                            "sv-SE",
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Aktiva moduler:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {tenant.modules.length > 0 ? (
                            tenant.modules.map((moduleId) => {
                              const module = AVAILABLE_MODULES.find(
                                (m) => m.id === moduleId,
                              );
                              return (
                                <Badge key={moduleId} variant="secondary">
                                  {module?.name || moduleId}
                                </Badge>
                              );
                            })
                          ) : (
                            <span className="text-sm text-gray-400">
                              Inga moduler
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Användarhantering
                </h2>
                <p className="text-sm text-gray-500">
                  Hantera alla användare över alla tenants
                </p>
              </div>

              <Dialog
                open={isCreateUserDialogOpen}
                onOpenChange={setIsCreateUserDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Skapa Användare
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Skapa ny användare</DialogTitle>
                    <DialogDescription>
                      Skapa en ny användare och koppla till en tenant.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="user-tenant">Tenant</Label>
                      <Select
                        value={selectedTenantForUser?.toString() || ""}
                        onValueChange={(value) =>
                          setSelectedTenantForUser(Number(value))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Välj tenant" />
                        </SelectTrigger>
                        <SelectContent>
                          {(tenants as any[]).map((tenant: Tenant) => (
                            <SelectItem
                              key={tenant.id}
                              value={tenant.id.toString()}
                            >
                              {tenant.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="user-firstName">Förnamn</Label>
                        <Input
                          id="user-firstName"
                          value={newUser.firstName}
                          onChange={(e) =>
                            setNewUser({
                              ...newUser,
                              firstName: e.target.value,
                            })
                          }
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <Label htmlFor="user-lastName">Efternamn</Label>
                        <Input
                          id="user-lastName"
                          value={newUser.lastName}
                          onChange={(e) =>
                            setNewUser({ ...newUser, lastName: e.target.value })
                          }
                          placeholder="Doe"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="user-email">E-post</Label>
                      <Input
                        id="user-email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) =>
                          setNewUser({ ...newUser, email: e.target.value })
                        }
                        placeholder="john.doe@example.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="user-password">Lösenord</Label>
                      <Input
                        id="user-password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) =>
                          setNewUser({ ...newUser, password: e.target.value })
                        }
                        placeholder="Ange lösenord"
                      />
                    </div>

                    <div>
                      <Label htmlFor="user-role">Roll</Label>
                      <Select
                        value={newUser.role}
                        onValueChange={(value) =>
                          setNewUser({ ...newUser, role: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_ROLES.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="user-lockRole"
                        checked={newUser.lockRole}
                        onCheckedChange={(checked) =>
                          setNewUser({
                            ...newUser,
                            lockRole: checked as boolean,
                          })
                        }
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="user-lockRole"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Lås roll
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Hindra att rollen kan ändras
                        </p>
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateUserDialogOpen(false)}
                    >
                      Avbryt
                    </Button>
                    <Button
                      onClick={handleCreateUser}
                      disabled={createUserMutation.isPending}
                    >
                      {createUserMutation.isPending
                        ? "Skapar..."
                        : "Skapa Användare"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* User Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtrera användare
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="filter-tenant">Tenant</Label>
                    <Input
                      id="filter-tenant"
                      placeholder="Filtrera efter tenant..."
                      value={userFilters.tenant}
                      onChange={(e) =>
                        setUserFilters({
                          ...userFilters,
                          tenant: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="filter-email">E-post</Label>
                    <Input
                      id="filter-email"
                      placeholder="Filtrera efter e-post..."
                      value={userFilters.email}
                      onChange={(e) =>
                        setUserFilters({
                          ...userFilters,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="filter-name">Namn</Label>
                    <Input
                      id="filter-name"
                      placeholder="Filtrera efter namn..."
                      value={userFilters.name}
                      onChange={(e) =>
                        setUserFilters({ ...userFilters, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="filter-role">Roll</Label>
                    <Input
                      id="filter-role"
                      placeholder="Filtrera efter roll..."
                      value={userFilters.role}
                      onChange={(e) =>
                        setUserFilters({ ...userFilters, role: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setUserFilters({
                        tenant: "",
                        email: "",
                        name: "",
                        role: "",
                      })
                    }
                  >
                    Rensa filter
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Users List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Alla användare ({filteredUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.isArray(filteredUsers) &&
                    filteredUsers.map((user: any) => {
                      const tenant = (tenants as any[]).find(
                        (t: any) => t.id === user.tenantId,
                      );
                      return (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {user.firstName?.charAt(0)}
                              {user.lastName?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {user.email}
                              </p>
                              <p className="text-xs text-gray-400">
                                Tenant: {tenant?.name || "Okänd"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {tenant?.name || "Okänd tenant"}
                            </Badge>
                            <Badge variant="secondary">{user.role}</Badge>
                            {user.lockRole && (
                              <Shield
                                className="h-4 w-4 text-red-500"
                              />
                            )}
                            {!user.isActive && (
                              <Badge variant="destructive">Inaktiv</Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  {(filteredUsers as any[]).length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      Inga användare hittades med de aktuella filtren.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Tenant Dialog */}
        <Dialog
          open={!!editingTenant}
          onOpenChange={() => setEditingTenant(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Redigera tenant</DialogTitle>
              <DialogDescription>
                Uppdatera tenant-information och moduler.
              </DialogDescription>
            </DialogHeader>

            {editingTenant && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-tenant-name">Tenant-namn</Label>
                  <Input
                    id="edit-tenant-name"
                    value={editingTenant.name}
                    onChange={(e) =>
                      setEditingTenant({
                        ...editingTenant,
                        name: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Moduler</Label>
                  <div className="space-y-3 mt-2">
                    {AVAILABLE_MODULES.map((module) => (
                      <div
                        key={module.id}
                        className="flex items-start space-x-3"
                      >
                        <Checkbox
                          id={`edit-module-${module.id}`}
                          checked={editingTenant.modules.includes(module.id)}
                          onCheckedChange={(checked) =>
                            handleModuleToggle(
                              module.id,
                              checked as boolean,
                              editingTenant,
                            )
                          }
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor={`edit-module-${module.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {module.name}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {module.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTenant(null)}>
                Avbryt
              </Button>
              <Button
                onClick={handleUpdateTenant}
                disabled={updateTenantMutation.isPending}
              >
                {updateTenantMutation.isPending ? "Uppdaterar..." : "Uppdatera"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog
          open={isEditUserDialogOpen}
          onOpenChange={setIsEditUserDialogOpen}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Redigera användare</DialogTitle>
              <DialogDescription>
                Uppdatera användarens information och behörigheter.
              </DialogDescription>
            </DialogHeader>
            {editingUser && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-email" className="text-right">
                    E-post
                  </Label>
                  <Input
                    id="edit-email"
                    value={editingUser.email}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, email: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-firstName" className="text-right">
                    Förnamn
                  </Label>
                  <Input
                    id="edit-firstName"
                    value={editingUser.firstName}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        firstName: e.target.value,
                      })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-lastName" className="text-right">
                    Efternamn
                  </Label>
                  <Input
                    id="edit-lastName"
                    value={editingUser.lastName}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        lastName: e.target.value,
                      })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-password" className="text-right">
                    Nytt lösenord
                  </Label>
                  <Input
                    id="edit-password"
                    type="password"
                    value={editingUser.password || ""}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        password: e.target.value,
                      })
                    }
                    className="col-span-3"
                    placeholder="Lämna tomt för att behålla nuvarande"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-role" className="text-right">
                    Roll
                  </Label>
                  <Select
                    value={editingUser.role}
                    onValueChange={(value) =>
                      setEditingUser({ ...editingUser, role: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Välj roll" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Användare</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="superadmin">Superadmin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Lås roll</Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <Checkbox
                      id="edit-lockRole"
                      checked={editingUser.lockRole}
                      onCheckedChange={(checked) =>
                        setEditingUser({
                          ...editingUser,
                          lockRole: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="edit-lockRole" className="text-sm">
                      Hindra att rollen kan ändras
                    </Label>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Aktiv</Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <Checkbox
                      id="edit-isActive"
                      checked={editingUser.isActive}
                      onCheckedChange={(checked) =>
                        setEditingUser({
                          ...editingUser,
                          isActive: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="edit-isActive" className="text-sm">
                      Användaren är aktiv
                    </Label>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditUserDialogOpen(false)}
              >
                Avbryt
              </Button>
              <Button
                onClick={handleUpdateUser}
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending
                  ? "Uppdaterar..."
                  : "Uppdatera användare"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
