/**
 * Micro Charts Component
 * 
 * This component provides small, in-cell visualizations like sparklines,
 * mini bar charts, and other compact data representations.
 */

import React, { useMemo } from 'react';

interface MicroChartProps {
  height: number;
  width: number;
}

interface MicroSparklineChartProps extends MicroChartProps {
  data: number[];
  color?: string;
  fillColor?: string;
  showDots?: boolean;
}

/**
 * MicroSparklineChart Component
 * 
 * Renders a small sparkline chart that shows trends at a glance
 * 
 * @param props Component properties
 * @returns React component
 */
export const MicroSparklineChart: React.FC<MicroSparklineChartProps> = ({
  data,
  height,
  width,
  color = '#3b82f6', // Blue
  fillColor = 'rgba(59, 130, 246, 0.2)', // Light blue
  showDots = false
}) => {
  // Handle empty data case
  if (!data.length) {
    return (
      <svg width={width} height={height}>
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          alignmentBaseline="middle"
          fontSize="8"
          fill="#9ca3af"
        >
          No data
        </text>
      </svg>
    );
  }
  
  // Compute min and max values for scaling
  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const range = maxValue - minValue;
  
  // Prevent division by zero
  const valueToY = (value: number) => {
    if (range === 0) return height / 2;
    return height - ((value - minValue) / range) * (height * 0.8) - (height * 0.1);
  };
  
  // Calculate points for the line
  const points = useMemo(() => {
    const segmentWidth = width / (data.length - 1);
    return data.map((value, index) => ({
      x: index * segmentWidth,
      y: valueToY(value)
    }));
  }, [data, width, height, minValue, maxValue, range]);
  
  // Create SVG path
  const linePath = useMemo(() => {
    return points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');
  }, [points]);
  
  // Create fill path (includes bottom line)
  const fillPath = useMemo(() => {
    if (points.length < 2) return '';
    
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    
    return `${linePath} L ${lastPoint.x} ${height} L ${firstPoint.x} ${height} Z`;
  }, [linePath, points, height]);
  
  return (
    <svg width={width} height={height} aria-hidden="true">
      {/* Fill area under the line */}
      <path d={fillPath} fill={fillColor} />
      
      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth={1.5} />
      
      {/* Data points (optional) */}
      {showDots && points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={2}
          fill={color}
        />
      ))}
      
      {/* Last data point (always shown) */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={2}
        fill={color}
      />
    </svg>
  );
};

interface MicroBarChartProps extends MicroChartProps {
  data: number[];
  color?: string;
  barPadding?: number;
}

/**
 * MicroBarChart Component
 * 
 * Renders a small bar chart for compact data representation
 * 
 * @param props Component properties
 * @returns React component
 */
export const MicroBarChart: React.FC<MicroBarChartProps> = ({
  data,
  height,
  width,
  color = '#3b82f6', // Blue
  barPadding = 1
}) => {
  // Handle empty data case
  if (!data.length) {
    return (
      <svg width={width} height={height}>
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          alignmentBaseline="middle"
          fontSize="8"
          fill="#9ca3af"
        >
          No data
        </text>
      </svg>
    );
  }
  
  // Compute min and max values for scaling
  const minValue = Math.min(0, ...data); // Ensure we include zero
  const maxValue = Math.max(...data);
  const range = maxValue - minValue;
  
  // Calculate bar width based on available space
  const barWidth = (width - (barPadding * (data.length - 1))) / data.length;
  
  // Calculate bar heights
  const bars = useMemo(() => {
    return data.map((value, index) => {
      const barHeight = range === 0 ? 0 : ((value - minValue) / range) * height;
      const x = index * (barWidth + barPadding);
      const y = height - barHeight;
      
      return {
        x,
        y,
        width: barWidth,
        height: barHeight,
        value
      };
    });
  }, [data, barWidth, barPadding, height, range, minValue]);
  
  return (
    <svg width={width} height={height} aria-hidden="true">
      {bars.map((bar, index) => (
        <rect
          key={index}
          x={bar.x}
          y={bar.y}
          width={bar.width}
          height={bar.height}
          fill={color}
          rx={1}
          ry={1}
        />
      ))}
    </svg>
  );
};

interface MicroProgressCircleProps extends MicroChartProps {
  value: number; // 0-100
  color?: string;
  backgroundColor?: string;
  strokeWidth?: number;
}

/**
 * MicroProgressCircle Component
 * 
 * Renders a circular progress indicator
 * 
 * @param props Component properties
 * @returns React component
 */
export const MicroProgressCircle: React.FC<MicroProgressCircleProps> = ({
  value,
  height,
  width,
  color = '#3b82f6', // Blue
  backgroundColor = '#e5e7eb', // Gray
  strokeWidth = 2
}) => {
  // Ensure value is between 0-100
  const normalizedValue = Math.max(0, Math.min(100, value));
  
  // Calculate dimensions
  const size = Math.min(width, height);
  const radius = (size / 2) - (strokeWidth / 2);
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference;
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={backgroundColor}
        strokeWidth={strokeWidth}
      />
      
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        strokeLinecap="round"
      />
      
      {/* Optional: Add text for the value */}
      {size >= 30 && (
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size / 4}
          fill={color}
          fontWeight="bold"
        >
          {normalizedValue}
        </text>
      )}
    </svg>
  );
};

export default {
  MicroSparklineChart,
  MicroBarChart,
  MicroProgressCircle
};
