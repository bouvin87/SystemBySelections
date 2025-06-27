import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker"; // Byt till rätt sökväg om det behövs

interface FloatingDatePickerProps {
  label: string;
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export function FloatingDatePicker({
  label,
  name,
  value,
  onChange,
  required = false,
  placeholder = "Välj datum",
  className,
}: FloatingDatePickerProps) {
  const [internalValue, setInternalValue] = useState("");

  const isControlled = value !== undefined && onChange !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleChange = (val: string) => {
    if (isControlled) {
      onChange(val);
    } else {
      setInternalValue(val);
    }
  };

  const id = `datepicker_${name}`;

  return (
    <div className={`relative w-full max-w-sm ${className ?? ""}`}>
      <Label
        htmlFor={id}
        className={`absolute bg-background px-1 left-2.5 text-muted-foreground text-sm transition-all transform origin-left -top-2 text-xs scale-90
          peer-focus:-top-2 peer-focus:text-xs peer-focus:scale-90
          peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:scale-100
          pointer-events-none z-10
        `}
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>

      <DatePicker
        id={id}
        name={name}
        value={currentValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="peer pt-3 w-full"
      />
    </div>
  );
}
