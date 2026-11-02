import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { WheelSliceVisual } from '../../types';
import { tokens } from '../../theme/theme';

interface WheelCanvasProps {
  slices: WheelSliceVisual[];
  rotation: number;
  size?: number;
  isSpinning?: boolean;
}

export const WheelCanvas: React.FC<WheelCanvasProps> = ({
  slices,
  rotation,
  size = 640,
  isSpinning = false,
}) => {
  const count = slices.length;
  const anglePerSlice = 360 / Math.max(1, count);
  const radius = size / 2;
  const center = radius;
  const wheelRadius = radius - 24; // Room for outer rim studs

  // Calculate slice path coordinates
  const slicePaths = useMemo(() => {
    return slices.map((slice, index) => {
      // Offset each slice so slice 0 is centered at the top (12 o'clock = 0 deg)
      const startAngle = index * anglePerSlice - anglePerSlice / 2;
      const endAngle = startAngle + anglePerSlice;

      // Convert angles from degrees (0 = top) to radians
      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;

      const x1 = center + wheelRadius * Math.cos(startRad);
      const y1 = center + wheelRadius * Math.sin(startRad);
      const x2 = center + wheelRadius * Math.cos(endRad);
      const y2 = center + wheelRadius * Math.sin(endRad);

      const largeArc = anglePerSlice > 180 ? 1 : 0;
      const pathData = `M ${center} ${center} L ${x1} ${y1} A ${wheelRadius} ${wheelRadius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      const midAngle = startAngle + anglePerSlice / 2;
      return {
        ...slice,
        pathData,
        midAngle,
      };
    });
  }, [slices, count, anglePerSlice, center, wheelRadius]);

  // Generate outer rim studs
  const studs = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const angle = (i * anglePerSlice - 90) * (Math.PI / 180);
      const studR = radius - 12;
      return {
        x: center + studR * Math.cos(angle),
        y: center + studR * Math.sin(angle),
      };
    });
  }, [count, anglePerSlice, center, radius]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: size,
        height: size,
        maxWidth: '100%',
        maxHeight: '100%',
        aspectRatio: '1 / 1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Outer ambient glow */}
      <Box
        sx={{
          position: 'absolute',
          width: size - 40,
          height: size - 40,
          borderRadius: '50%',
          boxShadow: isSpinning
            ? `0 0 60px 10px ${tokens.accentGlow}, 0 0 100px 20px rgba(255, 38, 0, 0.25)`
            : `0 0 40px 5px rgba(255, 38, 0, 0.15)`,
          transition: 'box-shadow 0.4s ease-out',
          pointerEvents: 'none',
        }}
      />

      {/* Rotating Wheel Container */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{
          transform: `rotate(${rotation}deg)`,
          transformOrigin: 'center center',
          willChange: 'transform',
        }}
      >
        <defs>
          {/* Outer Rim metallic gradient */}
          <radialGradient id="rimGrad" cx="50%" cy="50%" r="50%">
            <stop offset="90%" stopColor="#1E1E1E" />
            <stop offset="96%" stopColor="#383838" />
            <stop offset="100%" stopColor="#141414" />
          </radialGradient>

          {/* Central hub metallic bevel */}
          <radialGradient id="hubGrad" cx="45%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#2A2A2A" />
            <stop offset="70%" stopColor="#141414" />
            <stop offset="100%" stopColor="#080808" />
          </radialGradient>

          <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Ring */}
        <circle cx={center} cy={center} r={radius - 2} fill="url(#rimGrad)" stroke="#383838" strokeWidth="2" />
        <circle cx={center} cy={center} r={wheelRadius + 2} fill="none" stroke="#222222" strokeWidth="3" />

        {/* Slice Wedges */}
        <g>
          {slicePaths.map((slice, i) => {
            const isAlternate = i % 2 === 0;
            const sliceBg = slice.backgroundColor || (isAlternate ? '#181818' : '#222222');
            return (
              <g key={slice.id || i}>
                <path
                  d={slice.pathData}
                  fill={sliceBg}
                  stroke="#111111"
                  strokeWidth="2"
                  style={{
                    transition: 'fill 0.2s ease',
                  }}
                />

                {/* Radial text and label */}
                <g
                  transform={`rotate(${slice.midAngle}, ${center}, ${center}) translate(${center}, ${
                    center - wheelRadius * 0.62
                  })`}
                >
                  <text
                    x="0"
                    y="0"
                    fill={slice.textColor || '#FFFFFF'}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: count > 12 ? '11px' : count > 8 ? '13px' : '15px',
                      letterSpacing: '0.02em',
                      textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                    }}
                  >
                    {slice.label}
                  </text>

                  {/* Merchant tag if present */}
                  {slice.merchant && (
                    <text
                      x="0"
                      y="16"
                      fill={tokens.secondary}
                      textAnchor="middle"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 600,
                        fontSize: '9px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {slice.merchant.name}
                    </text>
                  )}
                </g>
              </g>
            );
          })}
        </g>

        {/* Outer Rim Studs/Pegs */}
        {studs.map((stud, idx) => (
          <circle key={idx} cx={stud.x} cy={stud.y} r="3.5" fill="#C5C5C5" stroke="#111111" strokeWidth="1" />
        ))}

        {/* Central Hub */}
        <circle cx={center} cy={center} r={radius * 0.24} fill="url(#hubGrad)" stroke={tokens.border} strokeWidth="3" />
        <circle
          cx={center}
          cy={center}
          r={radius * 0.21}
          fill="none"
          stroke={tokens.primary}
          strokeWidth="1.5"
          opacity="0.8"
        />

        {/* Central MobiOs Badge */}
        <text
          x={center}
          y={center - 4}
          fill="#FFFFFF"
          textAnchor="middle"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            fontSize: '18px',
            letterSpacing: '0.05em',
          }}
        >
          MobiOs
        </text>
        <text
          x={center}
          y={center + 14}
          fill={tokens.primary}
          textAnchor="middle"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: '10px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          INFOTEL
        </text>
      </svg>

      {/* Fixed Precision Pointer at Top (12 o'clock) */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.9))',
          pointerEvents: 'none',
        }}
      >
        <svg width="44" height="52" viewBox="0 0 44 52" fill="none">
          {/* Pointer Outer Bevel */}
          <path d="M22 50 L4 8 C4 3.5 12 0 22 0 C32 0 40 3.5 40 8 L22 50 Z" fill="#E62300" />
          <path d="M22 46 L8 10 C8 6 14 3 22 3 C30 3 36 6 36 10 L22 46 Z" fill="#FF2600" />
          {/* Inner Needle Highlight */}
          <circle cx="22" cy="14" r="5" fill="#FFFFFF" />
          <circle cx="22" cy="14" r="2.5" fill="#FF2600" />
        </svg>
      </Box>
    </Box>
  );
};
