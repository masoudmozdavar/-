import React from 'react';
import { getGraphicCharacter } from '../../utils/graphicAvatars';

interface GraphicAvatarProps {
  avatarId?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
  showBadge?: boolean;
  ring?: boolean;
  ringColor?: string;
  alt?: string;
}

const SIZE_MAP = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
  '2xl': 'w-20 h-20',
  '3xl': 'w-24 h-24',
};

const PIXEL_SIZE_MAP = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
  '2xl': 80,
  '3xl': 96,
};

export const GraphicAvatar: React.FC<GraphicAvatarProps> = ({
  avatarId,
  size = 'md',
  className = '',
  showBadge = false,
  ring = false,
  ringColor,
  alt,
}) => {
  const character = getGraphicCharacter(avatarId);
  const sizeClasses = SIZE_MAP[size] || SIZE_MAP.md;
  const pxSize = PIXEL_SIZE_MAP[size] || 40;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full select-none transition-transform ${sizeClasses} ${className}`}
      title={alt || character.nameFa}
      style={{
        boxShadow: ring
          ? `0 0 0 2px ${ringColor || character.accentColor}, 0 4px 12px ${character.accentColor}30`
          : undefined,
      }}
    >
      {/* High-res Vector Character SVG */}
      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center shadow-xs">
        {character.renderSvg({ size: pxSize, className: 'w-full h-full object-cover' })}
      </div>

      {/* Optional Mini Emoji or Role Badge */}
      {showBadge && (
        <span
          className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full bg-slate-900 border border-slate-700 shadow-md text-center"
          style={{
            width: Math.max(16, pxSize * 0.38),
            height: Math.max(16, pxSize * 0.38),
            fontSize: Math.max(9, pxSize * 0.22),
          }}
        >
          {character.badgeEmoji}
        </span>
      )}
    </div>
  );
};
