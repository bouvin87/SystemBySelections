import React, { useState } from "react";

interface FloatingInputProps {
  label: string;
  id: string;
  name: string;
  type?: string;
  value?: string;
  defaultValue?: string;
  required?: boolean;
  autoComplete?: string;
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FloatingInput({
  label,
  id,
  name,
  type = "text",
  value,
  required = false,
  autoComplete,
  className,
  onChange,
  defaultValue,
}: FloatingInputProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);

  const isControlled = value !== undefined && onChange !== undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isControlled) {
      onChange(e);
    } else {
      setInternalValue(e.target.value);
    }
  };

  const currentValue = isControlled ? (value ?? "") : internalValue;

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={currentValue}
        required={required}
        autoComplete={autoComplete}
        onChange={handleChange}
        placeholder=""
        className={`peer w-full h-12 px-4
    bg-transparent placeholder-transparent
    border border-slate-400 rounded-md
    transition duration-300 ease
    focus:outline-none focus:border-slate-600
    hover:border-slate-500
    shadow-sm focus:shadow ${className ?? ""}`}
      />
      <label
        htmlFor={id}
        className={`absolute bg-background px-1 left-2.5 text-muted-foreground text-sm transition-all transform origin-left -top-2 text-xs scale-90
          peer-focus:-top-2 peer-focus:text-xs peer-focus:scale-90
          peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:scale-100 
          pointer-events-none z-10
           `}
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
    </div>
  );
}
