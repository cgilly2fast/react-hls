import React, { useEffect, RefObject } from 'react';
import Hls, { HlsConfig, ErrorData } from 'hls.js';

declare global {
  interface Window {
    Hls: typeof Hls;
  }
}

export interface ReactHlsPlayerProps
  extends React.VideoHTMLAttributes<HTMLVideoElement> {
  hlsConfig?: Partial<HlsConfig>;
  playerRef?: RefObject<HTMLVideoElement>;
  getHLSInstance?: (hls: Hls) => void;
  src: string;
  onError?: (event: unknown, data?: ErrorData) => void;
}

const ReactHlsPlayer: React.FC<ReactHlsPlayerProps> = ({
  hlsConfig,
  playerRef,
  getHLSInstance,
  src,
  autoPlay,
  onError,
  ...props
}) => {
  const internalRef = playerRef || React.useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let hls: Hls | null;

    function initPlayer() {
      if (hls != null) {
        hls.destroy();
      }

      const newHls = new Hls({
        enableWorker: false,
        ...hlsConfig,
      });

      newHls.on(Hls.Events.MEDIA_ATTACHED, () => {
        newHls.loadSource(src);
      });

      newHls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (!autoPlay) {
          return;
        }

        try {
          internalRef?.current?.play();
        } catch (error) {
          console.warn('Play is not supported in this environment', error);
        }
      });

      newHls.on(Hls.Events.ERROR, (event, data) => {
        onError && onError(event, data);

        if (!data.fatal) {
          return;
        }
        console.warn(`HLS.js Error: ${data.type} - ${data.details}`);
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            newHls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            newHls.recoverMediaError();
            break;
          default:
            initPlayer();
            break;
        }
      });

      if (internalRef.current) {
        newHls.attachMedia(internalRef.current);
      }

      hls = newHls;
      getHLSInstance?.(newHls);
    }

    if (Hls.isSupported()) {
      initPlayer();
    } else {
      console.warn('HLS is not supported in this browser');
    }

    return () => {
      if (hls != null) {
        hls.destroy();
      }
    };
  }, [autoPlay, hlsConfig, playerRef, getHLSInstance, src]);

  if (!Hls.isSupported()) {
    return (
      <video
        ref={internalRef}
        src={src}
        autoPlay={autoPlay}
        data-testid="react-hls-player-fallback"
        {...props}
      >
        Your browser does not support the video tag.
      </video>
    );
  }

  return <video ref={internalRef} data-testid="react-hls-player" {...props} />;
};

export default ReactHlsPlayer;
