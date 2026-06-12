/**
 * Full-screen dim with an animated rounded cutout over the target anchor.
 * SVG mask approach: a dark rect with a transparent rounded-rect punched out.
 * Honors Reduce Motion (no spring / pulse).
 */
import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, AccessibilityInfo, Pressable } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';
import type { AnchorFrame } from './anchorRegistry';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const PADDING = 8;
const RADIUS = 16;

interface Props {
  frame: AnchorFrame | null;
  onPressBackdrop: () => void;
  /** when true, taps inside the cutout are NOT intercepted (reach the target) */
  passThroughCutout?: boolean;
  reduceMotion?: boolean;
}

export function SpotlightOverlay({
  frame,
  onPressBackdrop,
  passThroughCutout,
  reduceMotion,
}: Props) {
  const { width, height } = useWindowDimensions();

  const x = useSharedValue(frame ? frame.x - PADDING : width / 2);
  const y = useSharedValue(frame ? frame.y - PADDING : height / 2);
  const w = useSharedValue(frame ? frame.width + PADDING * 2 : 0);
  const h = useSharedValue(frame ? frame.height + PADDING * 2 : 0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!frame) return;
    const targetX = frame.x - PADDING;
    const targetY = frame.y - PADDING;
    const targetW = frame.width + PADDING * 2;
    const targetH = frame.height + PADDING * 2;

    if (reduceMotion) {
      x.value = targetX;
      y.value = targetY;
      w.value = targetW;
      h.value = targetH;
    } else {
      const cfg = { duration: 420, easing: Easing.out(Easing.cubic) };
      x.value = withTiming(targetX, cfg);
      y.value = withTiming(targetY, cfg);
      w.value = withTiming(targetW, cfg);
      h.value = withTiming(targetH, cfg);
    }
  }, [frame, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, [reduceMotion]);

  const cutoutProps = useAnimatedProps(() => ({
    x: x.value,
    y: y.value,
    width: w.value,
    height: h.value,
  }));

  const borderProps = useAnimatedProps(() => ({
    x: x.value,
    y: y.value,
    width: w.value,
    height: h.value,
    strokeOpacity: 0.35 + pulse.value * 0.5,
  }));

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={onPressBackdrop} accessibilityViewIsModal>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <Mask id="spotlight-mask">
            <Rect x={0} y={0} width={width} height={height} fill="white" />
            {frame && (
              <AnimatedRect animatedProps={cutoutProps} rx={RADIUS} ry={RADIUS} fill="black" />
            )}
          </Mask>
        </Defs>
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="rgba(0,0,0,0.72)"
          mask="url(#spotlight-mask)"
        />
        {frame && (
          <AnimatedRect
            animatedProps={borderProps}
            rx={RADIUS}
            ry={RADIUS}
            fill="transparent"
            stroke="#3FC39E"
            strokeWidth={2}
          />
        )}
      </Svg>
    </Pressable>
  );
}

export default SpotlightOverlay;
