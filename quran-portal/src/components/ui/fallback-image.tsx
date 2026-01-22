
import React from 'react';

interface FallbackImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  alt?: string;
}

export const FallbackImage: React.FC<FallbackImageProps> = ({ alt, src, ...props }) => {
  // Using the mosque image as fallback
  const fallbackSrc = "/default-og.png";
  
  return (
    <img 
      src={src || fallbackSrc}
      alt={alt || "QuranProgress - Excellence in Quran Learning"}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        if (target.src !== fallbackSrc) {
          target.src = fallbackSrc;
        }
      }}
      {...props}
    />
  );
};
