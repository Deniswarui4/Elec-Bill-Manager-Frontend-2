import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'destructive';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'default', 
  size = 'default', 
  className,
  children,
  ...props 
}) => {
  const getButtonClass = () => {
    let classes = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ';
    
    // Variant styles
    if (variant === 'primary') {
      classes += 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500 ';
    } else if (variant === 'outline') {
      classes += 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-blue-500 ';
    } else if (variant === 'destructive') {
      classes += 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 ';
    } else if (variant === 'secondary') {
      classes += 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-400 ';
    } else {
      classes += 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500 '; // default to primary
    }

    // Size styles
    if (size === 'sm') {
      classes += 'h-8 px-3 text-sm ';
    } else if (size === 'lg') {
      classes += 'h-11 px-8 text-base ';
    } else if (size === 'icon') {
      classes += 'h-9 w-9 p-0 ';
    } else {
      classes += 'h-10 px-4 py-2 text-sm '; // default size
    }
    
    return classes.trim();
  };

  return (
    <button
      className={cn(
        getButtonClass(),
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;