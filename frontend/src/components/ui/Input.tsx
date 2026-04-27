import { type InputHTMLAttributes, forwardRef } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium mb-1.5 text-gray-700 ml-1">{label}</label>}
        <input
          ref={ref}
          className={cn(
            "flex h-11 w-full glass-effect rounded-lg px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500/50 focus:ring-red-400/30",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
