import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { colors } from '../theme/theme';

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

function base(size: number) {
  return { width: size, height: size, viewBox: '0 0 24 24' } as const;
}

const common = (color: string, strokeWidth: number) => ({
  stroke: color,
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none' as const,
});

export function Plus({ size = 22, color = colors.text, strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Line x1={12} y1={5} x2={12} y2={19} {...common(color, strokeWidth)} />
      <Line x1={5} y1={12} x2={19} y2={12} {...common(color, strokeWidth)} />
    </Svg>
  );
}

export function Close({ size = 20, color = colors.text, strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Line x1={6} y1={6} x2={18} y2={18} {...common(color, strokeWidth)} />
      <Line x1={18} y1={6} x2={6} y2={18} {...common(color, strokeWidth)} />
    </Svg>
  );
}

export function ChevronDown({ size = 20, color = colors.text, strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M6 9l6 6 6-6" {...common(color, strokeWidth)} />
    </Svg>
  );
}

export function ChevronUp({ size = 20, color = colors.text, strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M6 15l6-6 6 6" {...common(color, strokeWidth)} />
    </Svg>
  );
}

export function Check({ size = 20, color = colors.text, strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M5 12.5l4.5 4.5L19 6.5" {...common(color, strokeWidth)} />
    </Svg>
  );
}

export function ChevronLeft({ size = 20, color = colors.text, strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M15 6l-6 6 6 6" {...common(color, strokeWidth)} />
    </Svg>
  );
}

export function ChevronRight({ size = 20, color = colors.text, strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M9 6l6 6-6 6" {...common(color, strokeWidth)} />
    </Svg>
  );
}

export function Search({ size = 20, color = colors.faint, strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Circle cx={11} cy={11} r={6.5} {...common(color, strokeWidth)} />
      <Line x1={16} y1={16} x2={20.5} y2={20.5} {...common(color, strokeWidth)} />
    </Svg>
  );
}

// ---- tab icons ----

export function DumbbellIcon({ size = 24, color = colors.faint, strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Line x1={8.5} y1={12} x2={15.5} y2={12} {...common(color, strokeWidth)} />
      <Rect x={3.5} y={8.5} width={3} height={7} rx={1} {...common(color, strokeWidth)} />
      <Rect x={17.5} y={8.5} width={3} height={7} rx={1} {...common(color, strokeWidth)} />
    </Svg>
  );
}

export function ListIcon({ size = 24, color = colors.faint, strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Line x1={9} y1={7} x2={20} y2={7} {...common(color, strokeWidth)} />
      <Line x1={9} y1={12} x2={20} y2={12} {...common(color, strokeWidth)} />
      <Line x1={9} y1={17} x2={20} y2={17} {...common(color, strokeWidth)} />
      <Circle cx={4.5} cy={7} r={1} fill={color} stroke="none" />
      <Circle cx={4.5} cy={12} r={1} fill={color} stroke="none" />
      <Circle cx={4.5} cy={17} r={1} fill={color} stroke="none" />
    </Svg>
  );
}

export function SlidersIcon({ size = 24, color = colors.faint, strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Line x1={4} y1={8} x2={20} y2={8} {...common(color, strokeWidth)} />
      <Line x1={4} y1={16} x2={20} y2={16} {...common(color, strokeWidth)} />
      <Circle cx={15} cy={8} r={2.4} {...common(color, strokeWidth)} fill={colors.bg} />
      <Circle cx={9} cy={16} r={2.4} {...common(color, strokeWidth)} fill={colors.bg} />
    </Svg>
  );
}

export function FlameIcon({ size = 24, color = colors.faint, strokeWidth = 1.75 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path
        d="M13 2c.4 3-1.6 4-2.8 5.4C9 8.8 8 10 8 12a4 4 0 0 0 8 0c0-1.6-.7-3-1.7-4.2C15.6 9 17 10.3 17 13a5 5 0 0 1-10 0c0-3.3 2.4-5.2 3.5-7C11.6 4.4 12.7 3.4 13 2z"
        {...common(color, strokeWidth)}
      />
    </Svg>
  );
}
