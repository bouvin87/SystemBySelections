import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Building2, Star, Quote } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import logoSvg from "@/lib/logo.svg?url";
import backgroundPng from "@/lib/background.png?url";
import { useTranslation } from "react-i18next";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [availableTenants, setAvailableTenants] = useState<any[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [showTenantSelection, setShowTenantSelection] = useState(false);
  const { login } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (showTenantSelection && selectedTenantId) {
        // Login with selected tenant
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            tenantId: parseInt(selectedTenantId),
          }),
        });

        const data = await response.json();

        if (response.ok && data.token) {
          localStorage.setItem("authToken", data.token);
          window.location.href = "/dashboard";
        } else {
          setError(data.message || "Login failed");
        }
      } else {
        // Initial login attempt
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (data.requireTenantSelection && data.tenants) {
          setAvailableTenants(data.tenants);
          setShowTenantSelection(true);
          setError("");
        } else if (response.ok && data.token) {
          localStorage.setItem("authToken", data.token);
          window.location.href = "/checklists";
        } else {
          setError(data.message || "Login failed");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login form */}
      <div className="flex-1 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <img
              src={logoSvg}
              alt={t("common.applicationName")}
              className="w-12 h-12"
            />
            <h1 className="ml-3 text-xl font-semibold text-gray-900">
              {t("common.applicationName")}
            </h1>
          </div>

          {/* Form */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {showTenantSelection
                ? "Välj organisation"
                : `Logga in på ${t("common.applicationName")}`}
            </h2>
            <p className="text-gray-600">
              {showTenantSelection
                ? "Välj vilken organisation du vill logga in på"
                : "Logga in för att komma åt dina moduler"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!showTenantSelection && (
              <>
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700"
                  >
                    E-postadress
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="din@email.se"
                    required
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-700"
                  >
                    Lösenord
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>
              </>
            )}

            {showTenantSelection && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    E-post: {email}
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="tenant"
                    className="text-sm font-medium text-gray-700"
                  >
                    Välj organisation
                  </Label>
                  <Select
                    value={selectedTenantId}
                    onValueChange={setSelectedTenantId}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Välj organisation" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTenants.map((tenant) => (
                        <SelectItem
                          key={tenant.id}
                          value={tenant.id.toString()}
                        >
                          {tenant.name} ({tenant.userRole})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              disabled={isLoading || (showTenantSelection && !selectedTenantId)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {showTenantSelection ? "Loggar in..." : "Kontrollerar..."}
                </>
              ) : showTenantSelection ? (
                "Logga in på organisation"
              ) : (
                "Logga in"
              )}
            </Button>

            {showTenantSelection && (
              <Button
                type="button"
                variant="outline"
                className="w-full h-11"
                onClick={() => {
                  setShowTenantSelection(false);
                  setAvailableTenants([]);
                  setSelectedTenantId("");
                  setError("");
                }}
                disabled={isLoading}
              >
                Tillbaka
              </Button>
            )}
          </form>
        </div>
      </div>

      {/* Right side - Background image with testimonial */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backgroundPng})` }}
        >
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* Testimonial card */}
        <div className="relative z-10 flex items-center justify-center p-12 w-full h-full">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 max-w-md">
            <blockquote className="text-white text-lg leading-relaxed mb-6">
              {t("common.applicationName")} is a modular platform for
              production-driven teams who need structure, clarity, and control.
              Whether you're managing shift logs, checklists, maintenance
              tickets or custom workflows – every section is organized, visual,
              and scalable. Designed for industries where precision matters,
              System by Sections brings order to complexity – one module at a
              time.
            </blockquote>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-white font-semibold">Christian Bouvin</div>
                <div className="text-white/70 text-sm">@SystemBySelections</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
