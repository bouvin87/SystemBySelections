import { useDeviceType } from "@/hooks/useDeviceType";
import { useLocation } from "wouter";
import DeviationModal from "@/components/DeviationModal";

interface SmartDeviationHandlerProps {
  isOpen: boolean;
  onClose: () => void;
  deviation?: any;
}

export function SmartDeviationHandler({ isOpen, onClose, deviation }: SmartDeviationHandlerProps) {
  const { isMobile } = useDeviceType();
  const [, setLocation] = useLocation();

  // On mobile, redirect to mobile page instead of opening modal
  if (isMobile && isOpen) {
    const route = deviation ? `/mobile/deviation/${deviation.id}` : "/mobile/deviation";
    setLocation(route);
    onClose(); // Close the modal trigger
    return null;
  }

  // On desktop, use the normal modal
  return (
    <DeviationModal
      isOpen={isOpen}
      onClose={onClose}
      deviation={deviation}
    />
  );
}