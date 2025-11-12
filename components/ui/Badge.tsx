import React from 'react';

export type BadgeVariant =
  | 'info'
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'sale'
  | 'featured'
  | 'organic'
  | 'local'
  | 'admin'
  | 'manager'
  | 'employee'
  | 'new';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'md',
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles = `
      inline-flex items-center justify-center
      font-semibold rounded-full
      transition-colors duration-200
    `;

    // Variant styles
    const variantStyles: Record<BadgeVariant, string> = {
      info: 'bg-blue-100 text-blue-800',
      default: 'bg-gray-100 text-gray-800',
      primary: 'bg-primary-100 text-primary-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-orange-100 text-orange-800',
      error: 'bg-red-100 text-red-800',
      sale: 'bg-red-100 text-red-800',
      admin: 'bg-red-100 text-red-800',
      featured: 'bg-yellow-100 text-yellow-800',
      manager: 'bg-yellow-100 text-yellow-800',
      organic: 'bg-green-100 text-green-800',
      employee: 'bg-green-100 text-green-800',
      local: 'bg-purple-100 text-purple-800',
      new: 'bg-green-600 text-white border-[4px] border-white outline outline-1 outline-green-600',
    };

    // Size styles
    const sizeStyles: Record<BadgeSize, string> = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
      lg: 'px-4 py-1.5 text-base',
    };

    // Combine all styles
    const combinedClassName = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <span ref={ref} className={combinedClassName} {...props}>
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
