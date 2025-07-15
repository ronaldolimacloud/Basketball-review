import React, { useState } from 'react';
import Button from './Button';
import type { ButtonHTMLAttributes } from 'react';

interface GameButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'indigo';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
}

export const GameButton: React.FC<GameButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  className = '',
  onClick,
  disabled,
  ...props
}) => {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    
    // Trigger the click animation
    setIsClicked(true);
    
    // Reset after animation
    setTimeout(() => {
      setIsClicked(false);
    }, 200);
    
    // Call the original onClick handler
    if (onClick) {
      onClick(e);
    }
  };

  // Override variant to success (green) when clicked
  const currentVariant = isClicked ? 'success' : variant;
  
  // Add animation classes
  const animationClasses = isClicked ? 'scale-95 ring-2 ring-emerald-400 ring-opacity-50' : '';

  return (
    <Button
      variant={currentVariant}
      size={size}
      className={`transition-all duration-200 ${animationClasses} ${className}`}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </Button>
  );
};