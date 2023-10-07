import React, { useRef, useEffect, useState, useCallback } from 'react';

const DiamondCanvas = () => {
  const canvasRef = useRef(null);
  const [light, setLight] = useState(null);
  const [paths, setPaths] = useState([]);


  const drawDiamond = (ctx, x, y, width, height) => {
    ctx.strokeStyle = "#313131";
    ctx.fillStyle = "#313131";

    ctx.shadowColor = "#000";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width / 2, y - height / 2);
    ctx.lineTo(x, y - height);
    ctx.lineTo(x - width / 2, y - height / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Reset shadow for inner glow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.beginPath();
    ctx.moveTo(x, y - 2);
    ctx.lineTo(x + width / 2 + 2, y - height / 2);
    ctx.lineTo(x, y - height + 2);
    ctx.lineTo(x - width / 2 - 2, y - height / 2);
    ctx.closePath();
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';
  };

  const drawLight = (ctx, x, y, radius = 5) => {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();

   
  };
 const drawLightTrail = (ctx, pastPositions) => {
      if (pastPositions.length < 2) return;
  
      for (let i = 1; i < pastPositions.length; i++) {
          const start = pastPositions[i - 1];
          const end = pastPositions[i];
  
          const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
          const opacity = (i / pastPositions.length).toFixed(2);
          
          gradient.addColorStop(0, `rgba(255, 0, 0, ${opacity})`);
          gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
          
          ctx.strokeStyle = gradient;
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
      }
  };
  const spawnLight = useCallback((paths) => {
    const randomPath = paths[Math.floor(Math.random() * paths.length)];
    setLight({
      path: randomPath,
      position: 0,
      pastPositions: [],
      despawnTime: 5000 + Math.random() * 5000,
      spawnTime: Date.now()
  });
  }, []);

  const moveLight = useCallback(() => {
    if (light) {
        const newPastPositions = [...light.pastPositions, light.path[light.position]];
        if (newPastPositions.length > 22) {  // Limit to 10 past positions
            newPastPositions.shift();
        }
        const newPosition = light.position + 1;
        if (newPosition < light.path.length) {
            setLight({
                ...light,
                position: newPosition,
                pastPositions: newPastPositions
            });
        } else {
            setLight(null);
            spawnLight(paths);
        }
    }
}, [light, paths, spawnLight]);


  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    const diamondWidth = 67;
    const diamondHeight = 67;
    const gap = 10.5;
    let newPaths = [];

    for (let y = 0; y < canvasRef.current.height; y += (diamondHeight + gap) / 2) {
      let xOffset = (y / ((diamondHeight + gap) / 2)) % 2 === 0 ? diamondWidth / 2 : 0;
      for (let x = 0; x < canvasRef.current.width; x += diamondWidth + gap) {
        drawDiamond(ctx, x + xOffset, y, diamondWidth, diamondHeight);
        // Create a path that moves through the gap
        newPaths.push([
          { x: x + xOffset + diamondWidth / 2, y: y },
          { x: x + xOffset + diamondWidth + gap / 2, y: y - diamondHeight / 2 },
          { x: x + xOffset + diamondWidth * 1.5 + gap, y: y }
        ]);
      }
    }

    setPaths(newPaths);
    spawnLight(newPaths);
  }, [spawnLight]);
  useEffect(() => {
    const intervalId = setInterval(moveLight, 1000); // adjust 100ms for desired speed

    return () => {
      clearInterval(intervalId); // Cleanup interval on component unmount
    };
}, [moveLight]);
  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    const drawScene = () => {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      // Drawing Diamonds and Light in the animation loop
      paths.forEach(path => {
        drawDiamond(ctx, path[0].x, path[0].y, 67, 67);
      });

      if (light) {
        const currentPos = light.path[light.position];
        drawLight(ctx, currentPos.x, currentPos.y);
    
        // Draw the fading line trail
        drawLightTrail(ctx, [currentPos, ...light.pastPositions]);
    }

      requestAnimationFrame(drawScene);
    };

    drawScene();
  }, [light, paths]);

  return <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} />;
};

export default DiamondCanvas;