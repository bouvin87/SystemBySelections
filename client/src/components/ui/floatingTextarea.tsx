import React, { useState } from "react";


interface FloatingTextareaProps {
  label: string;
  id: string;
  name: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  rows?: number;
  className?: string;
}

export function FloatingTextarea({
  label,
  id,
  name,
  value,
  required = false,
  rows = 3,
  className,
  onChange,
  defaultValue
}: FloatingTextareaProps) {

  const [internalValue, setInternalValue] = useState(defaultValue ?? "");

  const isControlled = value !== undefined && onChange !== undefined;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isControlled) {
      onChange(e);
    } else {
      setInternalValue(e.target.value);
    }
  };

  const currentValue = isControlled ? value : internalValue;

  return (
    <div className="relative">
      <textarea
        id={id}
        name={name}
        defaultValue={currentValue}
        required={required}
        rows={rows}
        onChange={handleChange}
        placeholder=""
        className={`peer w-full bg-transparent placeholder-transparent peer-focus:placeholder-opacity-0 border border-slate-400 rounded-md px-4 py-3 transition duration-300 ease focus:outline-none focus:border-slate-600 hover:border-slate-300 shadow-sm focus:shadow  ${className ?? ""}`}
      />
      <label
        htmlFor={id}
        className={`absolute cursor-text bg-background px-1 left-2.5 text-muted-foreground text-sm transition-all transform origin-left -top-2 text-xs scale-90
          peer-focus:-top-2 peer-focus:text-xs peer-focus:scale-90
          peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:scale-100
        `}
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
    </div>
  );
}
