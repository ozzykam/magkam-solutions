import React, { useId } from 'react';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  inputSize?: InputSize;
  fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      inputSize = 'md',
      fullWidth = false,
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    // Generate unique ID if not provided (React 18 useId hook)
    const generatedId = useId();
    const inputId = id || generatedId;

    // Build className using array approach for better Tailwind detection
    const inputClassName = [
      // Base styles
      'w-full rounded-md border px-4 py-3',
      'transition-colors duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500',
      'placeholder:text-gray-400',
      // State styles
      error
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
      // Size styles
      inputSize === 'sm' ? 'px-3 py-1.5 text-sm' : inputSize === 'lg' ? 'px-5 py-4 text-lg' : 'px-4 py-3 text-base',
      // Icon padding
      leftIcon && (inputSize === 'sm' ? 'pl-10' : inputSize === 'lg' ? 'pl-14' : 'pl-12'),
      rightIcon && (inputSize === 'sm' ? 'pr-10' : inputSize === 'lg' ? 'pr-14' : 'pr-12'),
      // Custom className
      className,
    ]
      .filter(Boolean)
      .join(' ');

    // Icon container positioning
    const iconSizeClass = inputSize === 'sm' ? 'w-4 h-4' : inputSize === 'lg' ? 'w-6 h-6' : 'w-5 h-5';

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div
              className={`
                absolute left-0 top-0 h-full flex items-center
                ${inputSize === 'sm' ? 'pl-3' : inputSize === 'lg' ? 'pl-5' : 'pl-4'}
                pointer-events-none text-gray-400
              `}
            >
              <span className={iconSizeClass}>{leftIcon}</span>
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            className={inputClassName}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />

          {/* Right Icon */}
          {rightIcon && (
            <div
              className={`
                absolute right-0 top-0 h-full flex items-center
                ${inputSize === 'sm' ? 'pr-3' : inputSize === 'lg' ? 'pr-5' : 'pr-4'}
                pointer-events-none text-gray-400
              `}
            >
              <span className={iconSizeClass}>{rightIcon}</span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* Helper Text */}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="mt-1 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
