import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChecklistForm } from "@/components/shared/ChecklistForm";

export default function MobileChecklistPage() {
  const [, setLocation] = useLocation();

  const handleSuccess = () => {
    setLocation("/");
  };

  const handleCancel = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center space-x-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="p-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Ny kontroll</h1>
      </div>

      {/* Form content */}
      <div className="p-4">
        <ChecklistForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          showProgress={true}
        />
      </div>
    </div>
  );
}