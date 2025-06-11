import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Checklist } from "@shared/schema";
import Navigation from "@/components/Navigation";
import FormModal from "@/components/FormModal";

export default function ChecklistStart() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [showModal, setShowModal] = useState(false);
  const checklistId = parseInt(id!);

  const { data: checklist, isLoading } = useQuery<Checklist>({
    queryKey: ["/api/checklists", checklistId],
  });

  useEffect(() => {
    if (checklist) {
      setShowModal(true);
    }
  }, [checklist]);

  const handleModalClose = () => {
    setShowModal(false);
    setLocation("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center py-12">
          <div className="text-lg">Laddar checklista...</div>
        </div>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-red-600">Checklista hittades inte</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Starta ny {checklist.name}
          </h1>
          <p className="text-gray-600">
            Formuläret öppnas automatiskt för att påbörja en ny kontroll.
          </p>
        </div>
      </div>
      
      <FormModal 
        isOpen={showModal} 
        onClose={handleModalClose}
        preselectedChecklistId={checklistId}
      />
    </div>
  );
}