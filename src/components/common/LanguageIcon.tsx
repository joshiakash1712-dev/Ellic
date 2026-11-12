import React from 'react';

interface LanguageIconProps {
  className?: string;
  variant?: 'current' | 'gradient';
}

/**
 * Custom Language icon component using the provided language translation glyph (/assets/aistudio/484633_21fb731e.png)
 * enhanced with Ellic theme styling (supports currentColor, gradient accents, and dark/light modes).
 */
export const LanguageIcon: React.FC<LanguageIconProps> = ({
  className = 'h-4 w-4',
  variant = 'current'
}) => {
  return (
    <span
      role="img"
      aria-label="Language"
      className={`inline-block relative shrink-0 select-none align-middle ${className}`}
    >
      <span
        className={`absolute inset-0 block ${
          variant === 'gradient'
            ? 'bg-gradient-to-tr from-blue-600 via-sky-500 to-cyan-400 dark:from-sky-400 dark:via-cyan-300 dark:to-blue-400'
            : 'bg-current'
        }`}
        style={{
          maskImage: 'url(/assets/aistudio/484633_21fb731e.png)',
          WebkitMaskImage: 'url(/assets/aistudio/484633_21fb731e.png)',
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskPosition: 'center'
        }}
      />
      <img
        src="/assets/aistudio/484633_21fb731e.png"
        alt=""
        aria-hidden="true"
        className="w-full h-full object-contain opacity-0 pointer-events-none"
      />
    </span>
  );
};
