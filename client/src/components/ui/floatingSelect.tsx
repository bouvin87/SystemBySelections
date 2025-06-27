import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import React from "react";

interface FloatingSelectProps {
  label: string;
  name: string;
  value?: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  children: React.ReactNode;
  className?: string
}

export function FloatingSelect({
  label,
  name,
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder = "Välj...",
  children,
  className
}: FloatingSelectProps) {
  const id = `select_${name}`;

  return (
    <div className={`relative ${className ?? ""}`}>
      <Label
        htmlFor={id}
        className={`absolute bg-background px-1 left-2.5 text-muted-foreground text-sm transition-all transform origin-left -top-2 text-xs scale-90
          peer-focus:-top-2 peer-focus:text-xs peer-focus:scale-90
          peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:scale-100 
          pointer-events-none z-10 
        `}
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>

      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        name={name}
        
      >
        <SelectTrigger
          id={id}
          className="peer w-full text-base"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}
