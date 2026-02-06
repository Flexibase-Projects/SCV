import { useVirtualizer } from '@tanstack/react-virtual';

const ROW_HEIGHT_DEFAULT = 64;
const OVERSCAN_DEFAULT = 5;
const SCROLL_MAX_HEIGHT = 560;

export interface VirtualizedTableBodyProps<T> {
  data: T[];
  parentRef: React.RefObject<HTMLDivElement | null>;
  rowHeight?: number;
  overscan?: number;
  getRowKey: (item: T, index: number) => string | number;
  /** Must return fragment of TableCell elements (not TableRow). */
  renderRow: (item: T, index: number) => React.ReactNode;
  /** Grid template columns (e.g. '8% 10% 14% 5% 10% 12% 10% 10% 8% 8% 5%') */
  gridTemplateColumns?: string;
  maxHeight?: number;
}

export function VirtualizedTableBody<T>({
  data,
  parentRef,
  rowHeight = ROW_HEIGHT_DEFAULT,
  overscan = OVERSCAN_DEFAULT,
  getRowKey,
  renderRow,
  gridTemplateColumns,
  maxHeight = SCROLL_MAX_HEIGHT,
}: VirtualizedTableBodyProps<T>) {
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  if (data.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        height: `${totalSize}px`,
        width: '100%',
        position: 'relative',
      }}
    >
      {virtualItems.map((virtualRow) => {
        const item = data[virtualRow.index];
        return (
          <div
            key={getRowKey(item, virtualRow.index)}
            data-index={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              minHeight: `${rowHeight}px`,
              height: `${rowHeight}px`,
              transform: `translateY(${virtualRow.start}px)`,
              display: 'grid',
              gridTemplateColumns: gridTemplateColumns || 'repeat(auto-fit, minmax(0, 1fr))',
              gridAutoRows: 'minmax(0, 1fr)',
              alignItems: 'center',
              borderBottom: '1px solid hsl(var(--border))',
            }}
            className="hover:bg-muted/50 transition-colors"
          >
            {renderRow(item, virtualRow.index)}
          </div>
        );
      })}
    </div>
  );
}

export const VIRTUAL_SCROLL_ROW_HEIGHT = ROW_HEIGHT_DEFAULT;
export const VIRTUAL_SCROLL_MAX_HEIGHT = SCROLL_MAX_HEIGHT;
