'use client';

import { ReactNode } from 'react';

interface SyncActionButtonProps {
  icon: ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'warning';
  disabled?: boolean;
}

export default function SyncActionButton({
  icon,
  label,
  description,
  onClick,
  variant = 'secondary',
  disabled = false,
}: SyncActionButtonProps) {
  const getVariantClasses = () => {
    if (disabled) {
      return 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200';
    }

    switch (variant) {
      case 'primary':
        return 'bg-[#111827] text-white hover:bg-gray-800 border-[#111827]';
      case 'warning':
        return 'bg-yellow-50 text-yellow-900 hover:bg-yellow-100 border-yellow-200';
      default:
        return 'bg-white text-gray-900 hover:bg-gray-50 border-gray-200';
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-start gap-4 p-4 rounded-lg border-2 transition-all
        ${getVariantClasses()}
        ${disabled ? '' : 'hover:shadow-md transform hover:-translate-y-0.5'}
      `}
    >
      <div
        className={`
          flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
          ${variant === 'primary' && !disabled ? 'bg-white bg-opacity-20' : ''}
          ${variant === 'warning' && !disabled ? 'bg-yellow-200' : ''}
          ${variant === 'secondary' && !disabled ? 'bg-gray-100' : ''}
          ${disabled ? 'bg-gray-200' : ''}
        `}
      >
        {icon}
      </div>

      <div className="flex-1 text-left">
        <h3 className="font-semibold text-sm mb-1">{label}</h3>
        <p
          className={`text-xs ${
            disabled
              ? 'text-gray-400'
              : variant === 'primary'
              ? 'text-white text-opacity-80'
              : variant === 'warning'
              ? 'text-yellow-700'
              : 'text-gray-600'
          }`}
        >
          {description}
        </p>
      </div>
    </button>
  );
}
