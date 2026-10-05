import React from 'react';

const PatrimonioLoader = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: { height: 28, gap: 4, barWidth: 4 },
    md: { height: 40, gap: 6, barWidth: 6 },
    lg: { height: 56, gap: 8, barWidth: 8 },
  };

  const { height, gap, barWidth } = sizes[size] || sizes.md;

  return (
    <div
      className={`patrimonio-loader ${className}`}
      role="status"
      aria-label="Cargando patrimonio"
      style={{ height, gap }}
    >
      {[35, 55, 45, 75, 60].map((h, i) => (
        <div
          key={i}
          className="bar"
          style={{
            width: barWidth,
            height: `${h}%`,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}

      <style>{`
        .patrimonio-loader {
          display: flex;
          align-items: flex-end;
        }

        .bar {
          background-color: #eeeeee;
          border-radius: 4px;
          transform-origin: bottom;
          animation: pulse 1.4s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scaleY(1);
            opacity: 0.7;
            background-color: #eeeeee;
          }
          50% {
            transform: scaleY(1.35);
            opacity: 1;
            background-color: #2b7fff;
          }
        }
      `}</style>
    </div>
  );
};

export default PatrimonioLoader;