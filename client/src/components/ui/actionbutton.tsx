import { ReactNode } from "react";

interface IconActionButtonProps {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
}

export default function IconActionButton({
  label,
  icon,
  onClick,
}: IconActionButtonProps) {
  return (
    <div className="flex flex-col items-center gap-1 w-18">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick?.();
        }}
        type="button"
        className="flex items-center justify-center w-16 h-12 rounded-full bg-white text-gray-900 border border-slate-400 hover:bg-accent hover:border-slate-200 transition"
      >
        <div className="w-8 h-8 flex items-center justify-center">
          {icon}
        </div>
      </button>
      <span className="text-sm text-gray-800 text-center truncate w-full">{label}</span>
    </div>
  );
}
