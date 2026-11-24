import React, { useMemo } from 'react';

export default function NoiseOverlay() {
  const noiseSvg = useMemo(() => {
    // Generate inline SVG feTurbulence noise
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)' opacity='0.7'/></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }, []);

  return (
    <div
      className="film-grain"
      style={{ backgroundImage: `url("${noiseSvg}")` }}
      aria-hidden="true"
    />
  );
}
