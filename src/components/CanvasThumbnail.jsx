import React, { useEffect, useRef } from 'react';
import gamesImage from '../assets/games.png';

const CanvasThumbnail = ({ gameName }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const setCanvasSize = () => {
      const width = Math.min(window.innerWidth * 1, 800); // Max width 800px
      const height = width * 0.8; // Maintain aspect ratio (e.g., 16:9 would be width * 0.5625)
      canvas.width = width;
      canvas.height = height;

      // Load and draw the image while maintaining aspect ratio
      const image = new Image();
      image.src = gamesImage;
      image.onload = () => {
        const imgRatio = image.width / image.height;
        let drawWidth = width;
        let drawHeight = width / imgRatio;

        if (drawHeight > height) {
          drawHeight = height;
          drawWidth = height * imgRatio;
        }

        const offsetX = (width - drawWidth) / 2;
        const offsetY = (height - drawHeight) / 2;

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

        // Draw game name
        

        // Shadow & Glow Effect
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        ctx.fillText(gameName, width / 2, height * 0.9);
      };
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    return () => {
      window.removeEventListener('resize', setCanvasSize);
    };
  }, [gameName]);

  return <canvas ref={canvasRef} className="w-full h-auto" />;
};

export default CanvasThumbnail;
