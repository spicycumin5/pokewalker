import { useEffect, useState } from 'react';

/** Cycles 0…frames-1 every intervalMs — choppy on purpose, like an LCD. */
export function useFrame(frames = 2, intervalMs = 500): number {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % frames), intervalMs);
    return () => clearInterval(id);
  }, [frames, intervalMs]);
  return frame;
}
