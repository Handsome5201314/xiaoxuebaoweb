import React, { useState } from 'react';
import { Image as ImageIcon, AlertCircle, Loader2 } from 'lucide-react';

interface ImageLoaderProps {
  src: string;
  alt: string;
  className?: string;
}

export const ImageLoader: React.FC<ImageLoaderProps> = ({ src, alt, className = "" }) => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  return (
    <div className={`relative rounded-lg overflow-hidden border border-gray-100 bg-gray-50 ${className}`}>
      
      {/* Image Element */}
      <img 
        src={src} 
        alt={alt}
        className={`w-full h-auto object-cover transition-opacity duration-300 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
      />

      {/* Loading State */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mb-2" />
          <span className="text-xs">正在生成图片...</span>
        </div>
      )}

      {/* Error State */}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-red-400 p-4 text-center">
          <AlertCircle className="w-8 h-8 mb-2" />
          <span className="text-xs">图片加载失败</span>
        </div>
      )}
    </div>
  );
};