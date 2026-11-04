import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

export type LedgerIconName =
  | 'home'
  | 'activity'
  | 'budget'
  | 'wallet'
  | 'categories'
  | 'profile'
  | 'plus'
  | 'income'
  | 'expense'
  | 'transfer'
  | 'clock'
  | 'chevron'
  | 'edit'
  | 'bell';

export function LedgerIcon({
  name,
  color,
  size = 22,
}: {
  name: LedgerIconName;
  color: string;
  size?: number;
}) {
  const common = {
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessibilityElementsHidden
      importantForAccessibility="no">
      {name === 'home' && (
        <>
          <Path d="M3 10.5 12 3l9 7.5V21H3V10.5Z" {...common} />
          <Path d="M9 21v-7h6v7" {...common} />
        </>
      )}
      {name === 'activity' && (
        <>
          <Path d="M4 20V4M4 20h17" {...common} />
          <Path d="m7 15 4-4 3 2 6-7" {...common} />
        </>
      )}
      {name === 'budget' && (
        <>
          <Circle cx="12" cy="12" r="9" {...common} />
          <Circle cx="12" cy="12" r="5" {...common} />
          <Circle cx="12" cy="12" r="1.5" fill={color} />
        </>
      )}
      {name === 'wallet' && (
        <>
          <Rect x="3" y="6" width="18" height="14" rx="2" {...common} />
          <Path d="M3 8V5a2 2 0 0 1 2-2h13" {...common} />
          <Path d="M16 13h5" {...common} />
        </>
      )}
      {name === 'categories' && (
        <>
          <Rect x="3" y="3" width="7" height="7" rx="1.5" {...common} />
          <Rect x="14" y="3" width="7" height="7" rx="1.5" {...common} />
          <Rect x="3" y="14" width="7" height="7" rx="1.5" {...common} />
          <Rect x="14" y="14" width="7" height="7" rx="1.5" {...common} />
        </>
      )}
      {name === 'profile' && (
        <>
          <Circle cx="12" cy="8" r="4" {...common} />
          <Path d="M4.5 21v-2a7.5 7.5 0 0 1 15 0v2" {...common} />
        </>
      )}
      {name === 'plus' && (
        <>
          <Line x1="12" y1="4" x2="12" y2="20" {...common} />
          <Line x1="4" y1="12" x2="20" y2="12" {...common} />
        </>
      )}
      {name === 'income' && (
        <>
          <Path d="M12 3v14m0 0-5-5m5 5 5-5M4 21h16" {...common} />
        </>
      )}
      {name === 'expense' && (
        <>
          <Path d="M12 21V7m0 0-5 5m5-5 5 5M4 3h16" {...common} />
        </>
      )}
      {name === 'transfer' && (
        <>
          <Path
            d="M4 8h16m0 0-4-4m4 4-4 4M20 16H4m0 0 4-4m-4 4 4 4"
            {...common}
          />
        </>
      )}
      {name === 'clock' && (
        <>
          <Circle cx="12" cy="12" r="9" {...common} />
          <Path d="M12 7v5l3 2" {...common} />
        </>
      )}
      {name === 'chevron' && <Path d="m9 5 7 7-7 7" {...common} />}
      {name === 'edit' && (
        <>
          <Path
            d="M12 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"
            {...common}
          />
          <Path d="m16 4 4 4-9 9-4 1 1-4 8-10Z" {...common} />
        </>
      )}
      {name === 'bell' && (
        <>
          <Path
            d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"
            {...common}
          />
        </>
      )}
    </Svg>
  );
}
