import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Palette, RotateCcw, Save, Eye } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { applyTheme, resetTheme, defaultTheme, type TenantTheme } from "@/lib/theme-manager";

interface TenantThemeResponse {
  colorPrimary?: string | null;
  colorSecondary?: string | null;
  colorAccent?: string | null;
  colorWarning?: string | null;
  colorBackground?: string | null;
  colorText?: string | null;
}

export default function TenantThemeSettings() {
  const { toast } = useToast();
  const [previewMode, setPreviewMode] = useState(false);
  const [localTheme, setLocalTheme] = useState<TenantTheme>(defaultTheme);

  // Fetch current tenant theme
  const { data: themeData, isLoading } = useQuery<TenantThemeResponse>({
    queryKey: ["/api/tenant/theme"],
  });

  // Apply theme when data is loaded
  useEffect(() => {
    if (themeData) {
      const theme = {
        colorPrimary: themeData.colorPrimary || defaultTheme.colorPrimary,
        colorSecondary: themeData.colorSecondary || defaultTheme.colorSecondary,
        colorAccent: themeData.colorAccent || defaultTheme.colorAccent,
        colorWarning: themeData.colorWarning || defaultTheme.colorWarning,
        colorBackground: themeData.colorBackground || defaultTheme.colorBackground,
        colorText: themeData.colorText || defaultTheme.colorText,
      };
      setLocalTheme(theme);
      // Apply theme to document
      applyTheme(theme);
    }
  }, [themeData]);

  // Update theme mutation
  const updateThemeMutation = useMutation({
    mutationFn: (theme: Partial<TenantTheme>) =>
      apiRequest({
        endpoint: "/api/tenant/theme",
        method: "PATCH",
        data: theme,
      }),
    onSuccess: () => {
      toast({
        title: "Färgtema uppdaterat",
        description: "Dina färginställningar har sparats framgångsrikt.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/theme"] });
      // Apply theme immediately
      applyTheme(localTheme);
    },
    onError: (error: any) => {
      toast({
        title: "Fel vid uppdatering",
        description: error.message || "Kunde inte spara färginställningarna.",
        variant: "destructive",
      });
    },
  });

  // Handle color change
  const handleColorChange = (colorKey: keyof TenantTheme, value: string) => {
    const newTheme = { ...localTheme, [colorKey]: value };
    setLocalTheme(newTheme);
    
    // Apply preview if preview mode is on
    if (previewMode) {
      applyTheme(newTheme);
    }
  };

  // Save theme
  const handleSave = () => {
    updateThemeMutation.mutate(localTheme);
  };

  // Reset to default
  const handleReset = () => {
    setLocalTheme(defaultTheme);
    if (previewMode) {
      applyTheme(defaultTheme);
    }
  };

  // Toggle preview mode
  const togglePreview = () => {
    const newPreviewMode = !previewMode;
    setPreviewMode(newPreviewMode);
    
    if (newPreviewMode) {
      applyTheme(localTheme);
    } else {
      // Restore original theme from server data
      if (themeData) {
        const originalTheme = {
          colorPrimary: (themeData as any).colorPrimary || defaultTheme.colorPrimary,
          colorSecondary: (themeData as any).colorSecondary || defaultTheme.colorSecondary,
          colorAccent: (themeData as any).colorAccent || defaultTheme.colorAccent,
          colorWarning: (themeData as any).colorWarning || defaultTheme.colorWarning,
          colorBackground: (themeData as any).colorBackground || defaultTheme.colorBackground,
          colorText: (themeData as any).colorText || defaultTheme.colorText,
        };
        applyTheme(originalTheme);
      }
    }
  };

  const colorFields = [
    {
      key: "colorPrimary" as keyof TenantTheme,
      label: "Primärfärg",
      description: "Huvudfärg för knappar och viktiga element",
    },
    {
      key: "colorSecondary" as keyof TenantTheme,
      label: "Sekundärfärg",
      description: "Sekundär färg för mindre viktiga element",
    },
    {
      key: "colorAccent" as keyof TenantTheme,
      label: "Accentfärg",
      description: "Färg för framhävning och speciella element",
    },
    {
      key: "colorWarning" as keyof TenantTheme,
      label: "Varningsfärg",
      description: "Färg för varningar och viktiga meddelanden",
    },
    {
      key: "colorBackground" as keyof TenantTheme,
      label: "Bakgrundsfärg",
      description: "Huvudbakgrundsfärg för applikationen",
    },
    {
      key: "colorText" as keyof TenantTheme,
      label: "Textfärg",
      description: "Huvudtextfärg för läsbarhet",
    },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Laddar färginställningar...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Färgtema för tenant
            </CardTitle>
            <CardDescription>
              Anpassa färger för att matcha ert företags profil. Ändringar tillämpas direkt för alla användare.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={previewMode ? "default" : "outline"}
              size="sm"
              onClick={togglePreview}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {previewMode ? "Förhandsvisning På" : "Förhandsvisning Av"}
            </Button>
            {previewMode && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Förhandsvisning aktiv
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Color Controls */}
        <div className="grid gap-6 md:grid-cols-2">
          {colorFields.map(({ key, label, description }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key} className="text-sm font-medium">
                {label}
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id={key}
                  type="color"
                  value={localTheme[key]}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  className="w-16 h-10 p-1 border-2"
                />
                <Input
                  type="text"
                  value={localTheme[key]}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  placeholder="#000000"
                  className="flex-1 font-mono text-sm"
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
              </div>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>

        <Separator />

        {/* Preview Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Förhandsvisning</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div 
              className="p-4 rounded-lg border"
              style={{ backgroundColor: localTheme.colorBackground, color: localTheme.colorText }}
            >
              <h4 className="font-medium mb-2">Bakgrund & Text</h4>
              <p className="text-sm">Detta visar hur text ser ut på bakgrunden.</p>
            </div>
            <div 
              className="p-4 rounded-lg text-white"
              style={{ backgroundColor: localTheme.colorPrimary }}
            >
              <h4 className="font-medium mb-2">Primärfärg</h4>
              <p className="text-sm">Knappar och viktiga element</p>
            </div>
            <div 
              className="p-4 rounded-lg text-white"
              style={{ backgroundColor: localTheme.colorAccent }}
            >
              <h4 className="font-medium mb-2">Accentfärg</h4>
              <p className="text-sm">Framhävning och speciella element</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Återställ till standard
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={updateThemeMutation.isPending}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {updateThemeMutation.isPending ? "Sparar..." : "Spara ändringar"}
          </Button>
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Tips för färgval
          </h4>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Använd förhandsvisning för att se ändringar direkt</li>
            <li>• Säkerställ tillräcklig kontrast mellan text och bakgrund</li>
            <li>• Testa färgkombinationer på olika skärmstorlekar</li>
            <li>• Färgändringar påverkar alla användare omedelbart</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}