import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
  clickable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      hover = false,
      clickable = false,
      padding = 'md',
      className = '',
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles = `
      bg-white rounded-lg shadow-md border border-gray-200
      transition-all duration-200
    `;

    // Hover effect
    const hoverStyles = hover || clickable ? 'hover:shadow-lg hover:border-primary-500' : '';

    // Clickable cursor
    const clickableStyles = clickable ? 'cursor-pointer' : '';

    // Padding styles
    const paddingStyles: Record<string, string> = {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    // Combine all styles
    const combinedClassName = `
      ${baseStyles}
      ${hoverStyles}
      ${clickableStyles}
      ${paddingStyles[padding]}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <div ref={ref} className={combinedClassName} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
