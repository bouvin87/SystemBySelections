import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function ModuleMissing() {
  const [location] = useLocation();
  const module = new URLSearchParams(window.location.search).get("module");

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navigation />
      <div className="flex-1 flex items-center justify-center text-center">
        <div className="max-w-xl w-full mx-auto">
          <h1 className="text-3xl font-semibold text-red-600 mb-4">Modul saknas</h1>
          <p className="text-muted-foreground text-lg mb-6">
            Modulen <strong>{module || "okänd"}</strong> är inte aktiverad för ditt konto.
          </p>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            className="flex items-center gap-2 mx-auto"
          >
            Till startsidan
          </Button>
        </div>
      </div>
    </div>
  );
}
