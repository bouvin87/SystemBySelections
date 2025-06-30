import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import FormModal from "@/components/FormModal";

export default function MobileChecklistPage() {
  const [, setLocation] = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleClose = () => {
    setIsModalOpen(false);
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center space-x-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="p-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Ny kontroll</h1>
      </div>

      {/* Use the existing FormModal as a fullscreen component on mobile */}
      <div className="p-4">
        <FormModal
          isOpen={isModalOpen}
          onClose={handleClose}
        />
      </div>
    </div>
  );
}