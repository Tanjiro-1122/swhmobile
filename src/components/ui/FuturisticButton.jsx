import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const FuturisticButton = React.forwardRef(({ 
  children, 
  className, 
  variant = 'primary', // primary, secondary, outline, ghost
  size = 'default', // sm, default, lg
  href,
  to,
  disabled,
  onClick,
  icon,
  ...props 
}, ref) => {
  
  const baseStyles = `
    relative overflow-hidden font-bold tracking-wide uppercase
    transition-all duration-300 ease-out
    flex items-center justify-center gap-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;
  
  const sizeStyles = {
    sm: 'px-4 py-2 text-xs rounded-lg',
    default: 'px-6 py-3 text-sm rounded-xl',
    lg: 'px-8 py-4 text-base rounded-xl',
  };
  
  const variantStyles = {
    primary: `
      bg-gradient-to-r from-lime-500 via-emerald-500 to-lime-500
      text-slate-900
      border border-lime-400/50
      shadow-lg shadow-lime-500/25
      hover:shadow-xl hover:shadow-lime-500/40
      hover:scale-[1.02]
      active:scale-[0.98]
    `,
    secondary: `
      bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600
      text-white
      border border-purple-400/50
      shadow-lg shadow-purple-500/25
      hover:shadow-xl hover:shadow-purple-500/40
      hover:scale-[1.02]
      active:scale-[0.98]
    `,
    outline: `
      bg-transparent
      text-lime-400
      border-2 border-lime-500/50
      hover:bg-lime-500/10
      hover:border-lime-400
      hover:shadow-lg hover:shadow-lime-500/20
      active:scale-[0.98]
    `,
    ghost: `
      bg-slate-800/50
      text-slate-300
      border border-slate-700/50
      hover:bg-slate-700/50
      hover:text-white
      hover:border-slate-600
      active:scale-[0.98]
    `,
    cyber: `
      bg-slate-900/90
      text-cyan-400
      border border-cyan-500/50
      shadow-lg shadow-cyan-500/20
      hover:shadow-xl hover:shadow-cyan-500/40
      hover:border-cyan-400
      hover:text-cyan-300
      active:scale-[0.98]
    `,
  };

  const buttonContent = (
    <>
      {/* Animated gradient overlay */}
      {(variant === 'primary' || variant === 'secondary') && (
        <motion.div
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
          style={{
            background: variant === 'primary' 
              ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
            backgroundSize: '200% 100%',
          }}
          animate={{ backgroundPosition: ['200% 0%', '-200% 0%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
      )}
      
      {/* Corner accents for cyber variant */}
      {variant === 'cyber' && (
        <>
          <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-400" />
          <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyan-400" />
          <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyan-400" />
          <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-400" />
        </>
      )}
      
      {/* Scan line effect */}
      {(variant === 'primary' || variant === 'secondary' || variant === 'cyber') && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
            backgroundSize: '100% 10px',
          }}
          animate={{ backgroundPosition: ['0% 0%', '0% 100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      )}
      
      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">
        {icon && <span className="w-5 h-5">{icon}</span>}
        {children}
      </span>
    </>
  );

  const combinedClassName = cn(
    baseStyles,
    sizeStyles[size],
    variantStyles[variant],
    className
  );

  // If it's a react-router Link
  if (to) {
    return (
      <Link to={to} className={combinedClassName} ref={ref} {...props}>
        {buttonContent}
      </Link>
    );
  }

  // If it's an external link
  if (href) {
    return (
      <a href={href} className={combinedClassName} ref={ref} {...props}>
        {buttonContent}
      </a>
    );
  }

  // Regular button
  return (
    <motion.button
      ref={ref}
      className={combinedClassName}
      disabled={disabled}
      onClick={onClick}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      {...props}
    >
      {buttonContent}
    </motion.button>
  );
});

FuturisticButton.displayName = 'FuturisticButton';

export { FuturisticButton };
export default FuturisticButton;