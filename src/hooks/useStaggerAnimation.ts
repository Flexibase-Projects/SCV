import { useEffect, useState } from 'react';

/**
 * Hook para animação escalonada (staggered) de elementos
 * Útil para KPIs e cards que aparecem em sequência
 */
export function useStaggerAnimation(
  itemCount: number,
  delayPerItem: number = 100,
  initialDelay: number = 0
) {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);

  useEffect(() => {
    setVisibleItems([]);
    
    const timers: NodeJS.Timeout[] = [];
    
    for (let i = 0; i < itemCount; i++) {
      const timer = setTimeout(() => {
        setVisibleItems(prev => [...prev, i]);
      }, initialDelay + (i * delayPerItem));
      
      timers.push(timer);
    }

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [itemCount, delayPerItem, initialDelay]);

  const isVisible = (index: number) => visibleItems.includes(index);

  return {
    isVisible,
    allVisible: visibleItems.length === itemCount
  };
}
