import type { CSSProperties } from 'react';

type Props = {
  className?: string;
  style?: CSSProperties;
  inline?: boolean;
};

export function Skeleton({ className = '', style, inline }: Props) {
  return (
    <span
      className={['skeleton', 'skeleton-shimmer', inline ? 'skeleton-inline' : '', className]
        .filter(Boolean)
        .join(' ')}
      style={style}
      aria-hidden
    />
  );
}
