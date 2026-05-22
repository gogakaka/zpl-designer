import { useEffect, useState } from 'react';

/** Load a data-URL/URL into an HTMLImageElement for Konva rendering. */
export function useLoadedImage(src: string | undefined): HTMLImageElement | undefined {
  const [img, setImg] = useState<HTMLImageElement>();
  useEffect(() => {
    if (!src) {
      setImg(undefined);
      return;
    }
    const image = new Image();
    let active = true;
    image.onload = () => {
      if (active) setImg(image);
    };
    image.src = src;
    return () => {
      active = false;
      image.onload = null;
    };
  }, [src]);
  return img;
}
