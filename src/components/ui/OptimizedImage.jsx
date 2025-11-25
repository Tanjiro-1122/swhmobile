import React, { useState } from "react";
import { cn } from "@/lib/utils";

export default function OptimizedImage({ 
  src, 
  alt, 
  fallbackIcon: FallbackIcon,
  className,
  containerClassName,
  ...props 
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {/* Loading skeleton */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer" 
          style={{
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite'
          }}
        />
      )}
      
      {/* Actual image */}
      {src && !hasError && (
        <img
          src={src}
          alt={alt}
          className={cn(
            "transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100",
            className
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
          loading="lazy"
          {...props}
        />
      )}
      
      {/* Fallback icon */}
      {(hasError || !src) && FallbackIcon && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/10">
          <FallbackIcon className="w-1/2 h-1/2 text-white/70" />
        </div>
      )}
      
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}