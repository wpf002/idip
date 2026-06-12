import React from 'react';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
import { COLORS } from '../theme';

export type IconName =
  | 'scan' | 'passport' | 'settings' | 'user' | 'logs' | 'chart'
  | 'check' | 'x' | 'alert' | 'chevron' | 'back' | 'camera'
  | 'refresh' | 'lock' | 'shield' | 'keypad' | 'flash' | 'edit' | 'logout';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 24, color = COLORS.textPrimary, strokeWidth = 2 }: Props) {
  const p = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {render(name, p, color)}
    </Svg>
  );
}

function render(name: IconName, p: object, color: string) {
  switch (name) {
    case 'scan':
      return (
        <>
          <Path d="M4 8V6a2 2 0 0 1 2-2h2" {...p} />
          <Path d="M16 4h2a2 2 0 0 1 2 2v2" {...p} />
          <Path d="M20 16v2a2 2 0 0 1-2 2h-2" {...p} />
          <Path d="M8 20H6a2 2 0 0 1-2-2v-2" {...p} />
          <Line x1="4" y1="12" x2="20" y2="12" {...p} />
        </>
      );
    case 'passport':
      return (
        <>
          <Rect x="5" y="3" width="14" height="18" rx="2" {...p} />
          <Circle cx="12" cy="10" r="3" {...p} />
          <Line x1="9" y1="17" x2="15" y2="17" {...p} />
        </>
      );
    case 'settings':
      return (
        <>
          <Line x1="4" y1="7" x2="20" y2="7" {...p} />
          <Line x1="4" y1="12" x2="20" y2="12" {...p} />
          <Line x1="4" y1="17" x2="20" y2="17" {...p} />
          <Circle cx="9" cy="7" r="2" fill={COLORS.bg} stroke={color} strokeWidth={2} />
          <Circle cx="15" cy="12" r="2" fill={COLORS.bg} stroke={color} strokeWidth={2} />
          <Circle cx="8" cy="17" r="2" fill={COLORS.bg} stroke={color} strokeWidth={2} />
        </>
      );
    case 'user':
      return (
        <>
          <Circle cx="12" cy="8" r="4" {...p} />
          <Path d="M4 21c0-4 4-6 8-6s8 2 8 6" {...p} />
        </>
      );
    case 'logs':
      return (
        <>
          <Line x1="8" y1="7" x2="20" y2="7" {...p} />
          <Line x1="8" y1="12" x2="20" y2="12" {...p} />
          <Line x1="8" y1="17" x2="20" y2="17" {...p} />
          <Circle cx="4" cy="7" r="1" fill={color} />
          <Circle cx="4" cy="12" r="1" fill={color} />
          <Circle cx="4" cy="17" r="1" fill={color} />
        </>
      );
    case 'chart':
      return (
        <>
          <Line x1="6" y1="20" x2="6" y2="12" {...p} />
          <Line x1="12" y1="20" x2="12" y2="6" {...p} />
          <Line x1="18" y1="20" x2="18" y2="15" {...p} />
        </>
      );
    case 'check':
      return <Polyline points="4 12 10 18 20 6" {...p} />;
    case 'x':
      return (
        <>
          <Line x1="6" y1="6" x2="18" y2="18" {...p} />
          <Line x1="18" y1="6" x2="6" y2="18" {...p} />
        </>
      );
    case 'alert':
      return (
        <>
          <Path d="M12 4 22 20H2L12 4Z" {...p} />
          <Line x1="12" y1="10" x2="12" y2="14" {...p} />
          <Circle cx="12" cy="17" r="0.6" fill={color} stroke={color} />
        </>
      );
    case 'chevron':
      return <Polyline points="9 6 15 12 9 18" {...p} />;
    case 'back':
      return <Polyline points="15 6 9 12 15 18" {...p} />;
    case 'camera':
      return (
        <>
          <Path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L19 6h0a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" {...p} />
          <Circle cx="12" cy="13" r="3.5" {...p} />
        </>
      );
    case 'refresh':
      return (
        <>
          <Path d="M20 11a8 8 0 1 0-1.5 5" {...p} />
          <Polyline points="20 5 20 11 14 11" {...p} />
        </>
      );
    case 'lock':
      return (
        <>
          <Rect x="5" y="11" width="14" height="9" rx="2" {...p} />
          <Path d="M8 11V8a4 4 0 0 1 8 0v3" {...p} />
        </>
      );
    case 'shield':
      return <Path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z" {...p} />;
    case 'keypad':
      return (
        <>
          {[6, 12, 18].map((y) =>
            [6, 12, 18].map((x) => <Circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" fill={color} />),
          )}
        </>
      );
    case 'flash':
      return <Path d="M13 3 5 13h6l-1 8 8-10h-6l1-8Z" {...p} />;
    case 'edit':
      return (
        <>
          <Path d="M5 19h14" {...p} />
          <Path d="M15 5 19 9 9 19H5v-4L15 5Z" {...p} />
        </>
      );
    case 'logout':
      return (
        <>
          <Path d="M14 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8" {...p} />
          <Polyline points="17 8 21 12 17 16" {...p} />
          <Line x1="21" y1="12" x2="10" y2="12" {...p} />
        </>
      );
    default:
      return null;
  }
}
