import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Building2, Settings, Trash2, Edit, Users } from "lucide-react";
import UserMenu from "@/components/UserMenu";
import type { Tenant } from "@shared/schema";

const AVAILABLE_MODULES = [
  { id: 'checklists', name: 'Checklistor', description: 'Hantera checklistor och kontroller' },
  { id: 'maintenance', name: 'Underhåll', description: 'Underhållsplanering och -uppföljning' },
  { id: 'analytics', name: 'Analys', description: 'Rapporter och dataanalys' },
  { id: 'inventory', name: 'Lager', description: 'Lagerhantering och inventering' }
];

export default function SuperAdmin() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [newTenant, setNewTenant] = useState({
    name: '',
    modules: [] as string[]
  });

  // Fetch all tenants
  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['/api/super-admin/tenants'],
    retry: false,
  });

  // Create tenant mutation
  const createTenantMutation = useMutation({
    mutationFn: async (tenantData: { name: string; modules: string[] }) => {
      return await apiRequest({
        endpoint: '/api/super-admin/tenants',
        method: 'POST',
        data: tenantData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/tenants'] });
      setIsCreateDialogOpen(false);
      setNewTenant({ name: '', modules: [] });
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
    mutationFn: async ({ id, data }: { id: number; data: { name: string; modules: string[] } }) => {
      return await apiRequest({
        endpoint: `/api/super-admin/tenants/${id}`,
        method: 'PATCH',
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/tenants'] });
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
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/tenants'] });
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
        modules: editingTenant.modules
      }
    });
  };

  const handleModuleToggle = (moduleId: string, isChecked: boolean, tenant?: Tenant) => {
    if (tenant) {
      // Editing existing tenant
      const updatedModules = isChecked
        ? [...tenant.modules, moduleId]
        : tenant.modules.filter(m => m !== moduleId);
      setEditingTenant({ ...tenant, modules: updatedModules });
    } else {
      // Creating new tenant
      const updatedModules = isChecked
        ? [...newTenant.modules, moduleId]
        : newTenant.modules.filter(m => m !== moduleId);
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
                <h1 className="text-2xl font-bold text-gray-900">SuperAdmin Panel</h1>
                <p className="text-sm text-gray-500">Hantera tenants och systemmoduler</p>
              </div>
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Tenants ({tenants.length})</h2>
            <p className="text-sm text-gray-500">Hantera alla tenants i systemet</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                  Skapa en ny tenant och välj vilka moduler som ska vara tillgängliga.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tenant-name">Tenant-namn</Label>
                  <Input
                    id="tenant-name"
                    value={newTenant.name}
                    onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                    placeholder="T.ex. Volvo Manufacturing"
                  />
                </div>

                <div>
                  <Label>Moduler</Label>
                  <div className="space-y-3 mt-2">
                    {AVAILABLE_MODULES.map((module) => (
                      <div key={module.id} className="flex items-start space-x-3">
                        <Checkbox
                          id={`module-${module.id}`}
                          checked={newTenant.modules.includes(module.id)}
                          onCheckedChange={(checked) => 
                            handleModuleToggle(module.id, checked as boolean)
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
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Avbryt
                </Button>
                <Button 
                  onClick={handleCreateTenant}
                  disabled={createTenantMutation.isPending}
                >
                  {createTenantMutation.isPending ? "Skapar..." : "Skapa Tenant"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tenants Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant: Tenant) => (
            <Card key={tenant.id} className="hover:shadow-md transition-shadow">
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
                      if (confirm('Är du säker på att du vill ta bort denna tenant?')) {
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
                      Skapad: {new Date(tenant.createdAt).toLocaleDateString('sv-SE')}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Aktiva moduler:</p>
                    <div className="flex flex-wrap gap-1">
                      {tenant.modules.length > 0 ? (
                        tenant.modules.map((moduleId) => {
                          const module = AVAILABLE_MODULES.find(m => m.id === moduleId);
                          return (
                            <Badge key={moduleId} variant="secondary">
                              {module?.name || moduleId}
                            </Badge>
                          );
                        })
                      ) : (
                        <span className="text-sm text-gray-400">Inga moduler</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Tenant Dialog */}
        <Dialog open={!!editingTenant} onOpenChange={() => setEditingTenant(null)}>
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
                    onChange={(e) => setEditingTenant({ ...editingTenant, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Moduler</Label>
                  <div className="space-y-3 mt-2">
                    {AVAILABLE_MODULES.map((module) => (
                      <div key={module.id} className="flex items-start space-x-3">
                        <Checkbox
                          id={`edit-module-${module.id}`}
                          checked={editingTenant.modules.includes(module.id)}
                          onCheckedChange={(checked) => 
                            handleModuleToggle(module.id, checked as boolean, editingTenant)
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
      </main>
    </div>
  );
}