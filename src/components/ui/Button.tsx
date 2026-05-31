import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';
    
    const variants = {
      primary: 'bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary/90',
      secondary: 'bg-secondary text-white hover:bg-secondary/80 border border-white/5',
      outline: 'bg-transparent border border-white/10 text-white hover:bg-white/5',
      destructive: 'bg-destructive text-white hover:bg-destructive/90 shadow-lg shadow-destructive/20',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs min-h-10',
      md: 'px-6 py-3 text-sm min-h-11',
      lg: 'px-8 py-4 text-base min-h-12',
      icon: 'p-2 min-h-11 min-w-11',
    };

    const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

    return (
      <button ref={ref} className={combinedClassName} disabled={isLoading} {...props}>
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>Processando...</span>
          </div>
        ) : children}
      </button>
    );
  }
);
