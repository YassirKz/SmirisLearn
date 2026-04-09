import React from 'react';
import logoAsset from '../../assets/logo.png';

/**
 * Reusable Logo component for Smiris Learn.
 * 
 * @param {Object} props
 * @param {string} props.size - Size of the logo ('sm', 'md', 'lg', or a custom Tailwind dimension like 'h-10').
 * @param {boolean} props.withText - Whether to show the "Smiris Learn" text.
 * @param {string} props.variant - 'naked' (no background) or 'branded' (background gradient box).
 * @param {boolean} props.light - Whether the background is dark (use white text).
 * @param {string} props.className - Additional classes for the container.
 */
const Logo = ({ 
  size = 'md', 
  withText = true, 
  variant = 'branded',
  light = false,
  className = "" 
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const currentSize = sizeClasses[size] || size;

  const logoIcon = (
    <div className={`relative flex-shrink-0 flex items-center justify-center overflow-hidden
      ${variant === 'branded' ? `bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl shadow-lg ${currentSize}` : currentSize}
    `}>
      <img 
        src={logoAsset} 
        alt="Smiris Learn" 
        className={`${variant === 'branded' ? 'w-full h-full object-cover scale-150' : 'w-full h-full object-contain'}`}
      />
    </div>
  );

  if (!withText) return logoIcon;

  return (
    <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
      {logoIcon}
      <span className={`font-bold tracking-tight whitespace-nowrap
        ${size === 'sm' ? 'text-base' : size === 'lg' ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'}
        ${light ? 'text-white' : 'text-gray-800 dark:text-white'}
      `}>
        Smiris Learn
      </span>
    </div>
  );
};

export default Logo;
