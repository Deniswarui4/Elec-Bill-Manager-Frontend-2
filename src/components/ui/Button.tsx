import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'destructive';
  size?: 'sm' | 'default' | 'lg';
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
    let classes = 'btn ';
    
    if (variant === 'primary') {
      classes += 'btn-primary';
    } else if (variant === 'outline') {
      classes += 'btn-outline';
    } else {
      classes += 'btn-primary'; // default to primary
    }
    
    return classes;
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