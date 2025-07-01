import { Home, FileText, Circle, User, MoreHorizontal } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();

  const navItems = [
    {
      icon: Home,
      label: "Hem",
      path: "/",
      active: location === "/",
    },
    {
      icon: FileText,
      label: "Checklistor",
      path: "/checklists",
      active: location === "/checklists",
    },
    {
      icon: Circle,
      label: "",
      path: "/scan",
      active: false,
      isCenter: true,
    },
    {
      icon: User,
      label: "Avvikelser",
      path: "/deviations",
      active: location === "/deviations",
    },
    {
      icon: MoreHorizontal,
      label: "Mer",
      path: "/admin",
      active: location === "/admin",
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 safe-area-pb">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item, index) => (
          <button
            key={index}
            onClick={() => setLocation(item.path)}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200",
              item.isCenter
                ? "bg-blue-500 text-white shadow-lg scale-110 w-14 h-14 rounded-full"
                : item.active
                ? "text-blue-500"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <item.icon 
              className={cn(
                "transition-all duration-200",
                item.isCenter 
                  ? "h-6 w-6" 
                  : "h-5 w-5"
              )} 
            />
            {!item.isCenter && (
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}