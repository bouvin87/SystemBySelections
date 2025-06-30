import { useDeviceType } from "@/hooks/useDeviceType";
import { useLocation } from "wouter";
import FormModal from "@/components/FormModal";

interface SmartFormHandlerProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedChecklistId?: number | null;
}

export function SmartFormHandler({ isOpen, onClose, preselectedChecklistId }: SmartFormHandlerProps) {
  const { isMobile } = useDeviceType();
  const [, setLocation] = useLocation();

  // On mobile, redirect to mobile page instead of opening modal
  if (isMobile && isOpen) {
    setLocation("/mobile/checklist");
    onClose(); // Close the modal trigger
    return null;
  }

  // On desktop, use the normal modal
  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      preselectedChecklistId={preselectedChecklistId || undefined}
    />
  );
}