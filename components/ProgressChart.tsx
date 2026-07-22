import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { colors, font, fontSize, spacing } from '../theme/theme';

export interface ChartPoint {
  label: string; // x-axis label (e.g. date)
  value: number;
  highlight?: boolean; // draw a filled marker (e.g. a PR)
}

/**
 * Lightweight line chart built on react-native-svg (Expo Go compatible).
 * Auto-sizes to its container width.
 */
export function ProgressChart({
  points,
  height = 180,
  title,
}: {
  points: ChartPoint[];
  height?: number;
  title?: string;
}) {
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  if (points.length < 2) {
    return (
      <View onLayout={onLayout} style={[styles.wrap, { height }]}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Log at least two days to see a trend.</Text>
        </View>
      </View>
    );
  }

  const padL = 40;
  const padR = 12;
  const padT = title ? 28 : 12;
  const padB = 22;
  const plotW = Math.max(0, width - padL - padR);
  const plotH = Math.max(0, height - padT - padB);

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const x = (i: number) => padL + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const y = (v: number) => padT + plotH - ((v - min) / span) * plotH;

  const polyline = points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ');

  return (
    <View onLayout={onLayout} style={[styles.wrap, { height }]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {width > 0 ? (
        <Svg width={width} height={height}>
          {/* horizontal gridlines + y labels (min / mid / max) */}
          {[min, (min + max) / 2, max].map((v, idx) => (
            <Line
              key={idx}
              x1={padL}
              y1={y(v)}
              x2={width - padR}
              y2={y(v)}
              stroke={colors.border}
              strokeWidth={1}
            />
          ))}
          {[max, (min + max) / 2, min].map((v, idx) => (
            <SvgText
              key={`t${idx}`}
              x={padL - 6}
              y={y(v) + 4}
              fontSize={10}
              fontFamily={font.mono}
              fill={colors.faint}
              textAnchor="end"
            >
              {Math.round(v)}
            </SvgText>
          ))}
          <Polyline
            points={polyline}
            fill="none"
            stroke={colors.text}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {points.map((p, i) => (
            <Circle
              key={i}
              cx={x(i)}
              cy={y(p.value)}
              r={p.highlight ? 5 : 3}
              fill={p.highlight ? colors.accent : colors.text}
              stroke={colors.card}
              strokeWidth={1.5}
            />
          ))}
          {/* first & last x labels */}
          <SvgText x={padL} y={height - 6} fontSize={10} fontFamily={font.mono} fill={colors.faint} textAnchor="start">
            {points[0].label}
          </SvgText>
          <SvgText
            x={width - padR}
            y={height - 6}
            fontSize={10}
            fontFamily={font.mono}
            fill={colors.faint}
            textAnchor="end"
          >
            {points[points.length - 1].label}
          </SvgText>
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  title: { fontSize: fontSize.xs, fontFamily: font.semibold, color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: spacing.sm },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: colors.faint, fontSize: fontSize.sm, fontFamily: font.regular },
});
