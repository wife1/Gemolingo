import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  
  const baseStyles = "font-bold uppercase tracking-widest rounded-2xl transition-transform active:translate-y-1 active:border-b-0 focus:outline-none";
  
  const variants = {
    primary: "bg-duo-green text-white border-b-4 border-duo-green-dark hover:bg-opacity-90",
    secondary: "bg-duo-blue text-white border-b-4 border-duo-blue-dark hover:bg-opacity-90",
    danger: "bg-duo-red text-white border-b-4 border-duo-red-dark hover:bg-opacity-90",
    ghost: "bg-transparent text-duo-blue hover:bg-duo-gray/20 border-none !active:translate-y-0",
    outline: "bg-white text-gray-500 border-2 border-b-4 border-gray-300 hover:bg-gray-50 active:border-b-2"
  };

  const sizes = {
    sm: "py-2 px-4 text-xs",
    md: "py-3 px-6 text-sm",
    lg: "py-4 px-8 text-base"
  };

  return (
    <button 
      className={`
        ${baseStyles} 
        ${variants[variant]} 
        ${sizes[size]} 
        ${fullWidth ? 'w-full' : ''}
        ${props.disabled ? 'opacity-50 cursor-not-allowed active:translate-y-0 active:border-b-4' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

export const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => {
  return (
    <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
      <div 
        className="h-full bg-duo-green transition-all duration-500 ease-out rounded-full"
        style={{ width: `${Math.max(5, progress)}%` }}
      />
    </div>
  );
};

export const Card: React.FC<{ children: React.ReactNode, className?: string, selected?: boolean, onClick?: () => void }> = ({ 
  children, 
  className = '', 
  selected = false,
  onClick
}) => {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-white border-2 border-b-4 rounded-2xl p-4 cursor-pointer transition-all
        ${selected 
          ? 'border-duo-blue bg-blue-50 text-duo-blue' 
          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
        }
        ${className}
      `}
    >
      {children}
    </div>
  );
};
