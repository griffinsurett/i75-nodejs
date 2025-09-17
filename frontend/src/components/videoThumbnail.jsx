import { useState } from 'react';

/**
 * Generates a thumbnail from a video file
 * @param {File|Blob|string} source - Video file, blob, or URL
 * @param {number} seekTime - Time in seconds to capture frame (default: 1)
 * @returns {Promise<string|null>} - Thumbnail URL or null if failed
 */
export async function generateVideoThumbnail(source, seekTime = 1) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Handle different input types
    let videoUrl;
    if (typeof source === 'string') {
      videoUrl = source;
    } else if (source instanceof File || source instanceof Blob) {
      videoUrl = URL.createObjectURL(source);
    } else {
      resolve(null);
      return;
    }
    
    video.autoplay = false;
    video.muted = true;
    video.src = videoUrl;
    
    video.onloadeddata = () => {
      // Seek to specified time or 10% of duration
      video.currentTime = Math.min(seekTime, video.duration * 0.1);
    };
    
    video.onseeked = () => {
      try {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const thumbnailUrl = URL.createObjectURL(blob);
            // Clean up the video URL if we created it
            if (source instanceof File || source instanceof Blob) {
              URL.revokeObjectURL(videoUrl);
            }
            resolve(thumbnailUrl);
          } else {
            resolve(null);
          }
        }, 'image/jpeg', 0.75);
      } catch (error) {
        console.error('Failed to generate thumbnail:', error);
        if (source instanceof File || source instanceof Blob) {
          URL.revokeObjectURL(videoUrl);
        }
        resolve(null);
      }
    };
    
    video.onerror = () => {
      if (source instanceof File || source instanceof Blob) {
        URL.revokeObjectURL(videoUrl);
      }
      resolve(null);
    };
  });
}

/**
 * Component for rendering video with thumbnail and play overlay
 * @param {string} src - Video URL for fallback
 * @param {string} thumbnailSrc - Thumbnail image URL
 * @param {string} alt - Alt text for accessibility
 * @param {string} className - Additional classes for the container
 * @param {boolean} showPlayButton - Whether to show play button overlay (default: true)
 * @param {string} playButtonSize - Size of play button ('small', 'medium', 'large')
 * @param {boolean} fallbackToVideo - Whether to fall back to video element if no thumbnail
 */
export function VideoThumbnail({ 
  src, 
  thumbnailSrc, 
  alt, 
  className = '',
  showPlayButton = true,
  playButtonSize = 'small',
  fallbackToVideo = true
}) {
  const [thumbnailError, setThumbnailError] = useState(false);
  
  // Play button size classes
  const playButtonSizes = {
    small: {
      wrapper: 'p-1',
      svg: 'w-3 h-3'
    },
    medium: {
      wrapper: 'p-2',
      svg: 'w-6 h-6'
    },
    large: {
      wrapper: 'p-3',
      svg: 'w-10 h-10'
    }
  };
  
  const buttonSize = playButtonSizes[playButtonSize] || playButtonSizes.small;
  
  if (thumbnailSrc && !thumbnailError) {
    return (
      <div className={`relative w-full h-full ${className}`}>
        <img
          src={thumbnailSrc}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setThumbnailError(true)}
        />
        {showPlayButton && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`bg-black/50 rounded-full ${buttonSize.wrapper}`}>
              <svg
                className={`${buttonSize.svg} text-white`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  if (fallbackToVideo && src && !thumbnailError) {
    return (
      <div className={`relative w-full h-full ${className}`}>
        <video
          src={src}
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="metadata"
          onLoadedMetadata={(e) => {
            e.target.currentTime = Math.min(1, e.target.duration * 0.1);
          }}
        />
        {showPlayButton && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`bg-black/50 rounded-full ${buttonSize.wrapper}`}>
              <svg
                className={`${buttonSize.svg} text-white`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  return null;
}