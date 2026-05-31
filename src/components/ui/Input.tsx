import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const errorId = error && id ? `${id}-error` : undefined;
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-2xs font-bold text-muted-foreground ml-1 uppercase tracking-[0.2em]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={`
            w-full bg-secondary/30 border ${error ? 'border-destructive/50' : 'border-white/5'} 
            rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 
            focus:bg-secondary/60 transition-all font-medium placeholder:text-muted-foreground/30
            ${className}
          `}
          {...props}
        />
        {error && (
          <span id={errorId} className="text-2xs text-destructive font-bold ml-1 uppercase animate-in fade-in slide-in-from-top-1">
            {error}
          </span>
        )}
      </div>
    );
  }
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string | number }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', id, ...props }, ref) => {
    const errorId = error && id ? `${id}-error` : undefined;
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-2xs font-bold text-muted-foreground ml-1 uppercase tracking-[0.2em]"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={`
            w-full bg-secondary/30 border ${error ? 'border-destructive/50' : 'border-white/5'} 
            rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 
            focus:bg-secondary/60 transition-all font-medium appearance-none
            ${className}
          `}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-card text-white">
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <span id={errorId} className="text-2xs text-destructive font-bold ml-1 uppercase animate-in fade-in slide-in-from-top-1">
            {error}
          </span>
        )}
      </div>
    );
  }
);
