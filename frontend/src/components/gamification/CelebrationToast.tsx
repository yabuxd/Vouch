import { useEffect } from 'react';

type Props = {
  message: string;
  sub?: string;
  onDone: () => void;
};

export function CelebrationToast({ message, sub, onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="celebration-toast" role="status">
      <div className="celebration-burst" aria-hidden>
        {['◎', '🔥', '✦', '◎', '✦'].map((c, i) => (
          <span key={i} className={`celebration-particle celebration-particle-${i}`}>{c}</span>
        ))}
      </div>
      <p className="celebration-message">{message}</p>
      {sub && <p className="celebration-sub">{sub}</p>}
    </div>
  );
}
