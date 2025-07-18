import React from 'react';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'indigo';
  size?: 'small' | 'medium' | 'large';
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'medium',
  className = '',
  ...props
}) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black shadow-lg hover:shadow-xl border-2 border-transparent hover:border-yellow-300',
    secondary: 'bg-zinc-700 hover:bg-zinc-600 text-white border-2 border-transparent hover:border-zinc-500',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-transparent hover:border-emerald-400',
    danger: 'bg-red-600 hover:bg-red-700 text-white border-2 border-transparent hover:border-red-400',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white border-2 border-transparent hover:border-amber-400',
    info: 'bg-cyan-600 hover:bg-cyan-700 text-white border-2 border-transparent hover:border-cyan-400',
    indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-transparent hover:border-indigo-400',
  };

  const sizeClasses = {
    small: 'px-2 py-1 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  };
  const classes = `${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};

export default Button; 