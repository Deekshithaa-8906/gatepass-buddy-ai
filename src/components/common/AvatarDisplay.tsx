import React from 'react';

interface AvatarDisplayProps {
  name: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-3xl'
};

export function AvatarDisplay({ name, imageUrl, size = 'md', className = '' }: AvatarDisplayProps) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <div className={`relative flex items-center justify-center rounded-full bg-[#CD0000] text-white font-bold overflow-hidden shadow-sm flex-shrink-0 ${sizeClasses[size]} ${className}`}>
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}
