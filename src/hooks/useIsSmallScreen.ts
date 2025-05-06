import { useEffect, useState } from 'react';

export function useIsSmallScreen(breakpoint = 768) {
  const [isSmall, setIsSmall] = useState(() => window.innerWidth < breakpoint);

  useEffect(() => {
    const onResize = () => setIsSmall(window.innerWidth < breakpoint);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);

  return isSmall;
} 