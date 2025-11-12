import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // Build className using array approach for better Tailwind detection
    const variantClasses: Record<ButtonVariant, string[]> = {
      primary: [
        'bg-primary-600 text-white',
        'hover:bg-primary-700 active:bg-primary-800',
        'focus:ring-primary-500',
        'shadow-sm hover:shadow-md',
        'disabled:bg-gray-300 disabled:text-gray-500',
      ],
      secondary: [
        'bg-gray-200 text-gray-900',
        'hover:bg-gray-300 active:bg-gray-400',
        'focus:ring-gray-500',
        'disabled:bg-gray-100 disabled:text-gray-400',
      ],
      outline: [
        'border-2 border-primary-600 text-primary-600 bg-transparent',
        'hover:bg-primary-50 active:bg-primary-100',
        'focus:ring-primary-500',
        'disabled:border-gray-300 disabled:text-gray-400',
      ],
      danger: [
        'bg-red-600 text-white',
        'hover:bg-red-700 active:bg-red-800',
        'focus:ring-red-500',
        'shadow-sm hover:shadow-md',
        'disabled:bg-gray-300 disabled:text-gray-500',
      ],
      ghost: [
        'text-gray-700 bg-transparent',
        'hover:bg-gray-100 active:bg-gray-200',
        'focus:ring-gray-500',
        'disabled:text-gray-400',
      ],
      link: [
        'text-primary-600 bg-transparent',
        'hover:text-primary-700 hover:underline',
        'focus:ring-primary-500',
        'disabled:text-gray-400',
        'shadow-none',
      ],
    };

    const combinedClassName = [
      // Base styles
      'inline-flex items-center justify-center gap-2',
      'font-semibold rounded-md',
      'transition-colors duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'active:scale-95 transition-transform',
      // Variant styles
      ...variantClasses[variant],
      // Size styles
      size === 'sm' ? 'px-3 py-1.5 text-sm' : size === 'lg' ? 'px-8 py-4 text-lg' : 'px-6 py-3 text-base',
      // Width
      fullWidth && 'w-full',
      // Custom className
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={combinedClassName}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && <span className="inline-flex">{leftIcon}</span>}
        <span>{children}</span>
        {!loading && rightIcon && <span className="inline-flex">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
