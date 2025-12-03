/**
 * SHARE ICON ATOM
 * 
 * Custom share icon from SVG
 */

import Svg, { G, Path, Defs, ClipPath, Rect } from 'react-native-svg';

interface ShareIconProps {
  size?: number;
  color?: string;
}

export default function ShareIcon({ size = 24, color = 'white' }: ShareIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G clipPath="url(#clip0_4482_95)">
        <Path
          d="M6.40991 15.16C8.15513 15.16 9.57007 13.7452 9.57007 12C9.57007 10.2548 8.15513 8.84003 6.40991 8.84003C4.66469 8.84003 3.25 10.2548 3.25 12C3.25 13.7452 4.66469 15.16 6.40991 15.16Z"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M17.5898 8.32C19.3351 8.32 20.7498 6.90522 20.7498 5.16C20.7498 3.41478 19.3351 2 17.5898 2C15.8446 2 14.4297 3.41478 14.4297 5.16C14.4297 6.90522 15.8446 8.32 17.5898 8.32Z"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M17.5898 21.9999C19.3351 21.9999 20.7498 20.5852 20.7498 18.8399C20.7498 17.0947 19.3351 15.6799 17.5898 15.6799C15.8446 15.6799 14.4297 17.0947 14.4297 18.8399C14.4297 20.5852 15.8446 21.9999 17.5898 21.9999Z"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M9.09961 10.34L14.8894 6.80005"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M9.09961 13.6599L14.8894 17.1999"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_4482_95">
          <Rect width="24" height="24" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}
