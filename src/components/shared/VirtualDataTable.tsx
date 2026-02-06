import { useRef, useState, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type Row,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';
import type { VirtualDataTableColumnMeta } from './virtualDataTableTypes';

const ROW_HEIGHT_DEFAULT = 52;
const OVERSCAN_DEFAULT = 8;
const MAX_HEIGHT_DEFAULT = 560;

export interface VirtualDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  getRowId: (row: T) => string;
  maxHeight?: number;
  rowHeight?: number;
  estimatedSize?: number;
  minTableWidth?: number;
}

function getColumnMeta<T>(column: { columnDef?: { meta?: VirtualDataTableColumnMeta } }): VirtualDataTableColumnMeta | undefined {
  return (column.columnDef as { meta?: VirtualDataTableColumnMeta } | undefined)?.meta;
}

/** Para colunas com width "minmax(X, 1fr)" retorna flex que permite crescimento. */
function getFlexStyle(meta: VirtualDataTableColumnMeta | undefined): string {
  if (!meta?.width) return '1 1 0';
  const w = meta.width.trim();
  const minmaxMatch = w.match(/minmax\s*\(\s*(\d+)px\s*,\s*1fr\s*\)/);
  if (minmaxMatch) return `1 1 ${minmaxMatch[1]}px`;
  return `0 0 ${meta.width}`;
}

function cellAlignClass(align?: 'left' | 'right' | 'center'): string {
  switch (align) {
    case 'right':
      return 'text-right justify-end';
    case 'center':
      return 'text-center justify-center';
    default:
      return 'text-left justify-start';
  }
}

export function VirtualDataTable<T>({
  data,
  columns,
  getRowId,
  maxHeight = MAX_HEIGHT_DEFAULT,
  rowHeight = ROW_HEIGHT_DEFAULT,
  estimatedSize = ROW_HEIGHT_DEFAULT,
  minTableWidth,
}: VirtualDataTableProps<T>) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollReady, setScrollReady] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);

  const setScrollRef = useCallback((el: HTMLDivElement | null) => {
    (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    if (el) setScrollReady(true);
  }, []);

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => getRowId(row as T),
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;
  const headerGroups = table.getHeaderGroups();
  const flatHeaders = headerGroups[0]?.headers ?? [];

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimatedSize,
    overscan: OVERSCAN_DEFAULT,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <div
        ref={setScrollRef}
        className="overflow-auto w-full min-w-0"
        style={{ maxHeight, scrollbarGutter: 'stable' }}
        role="table"
        aria-rowcount={rows.length}
        aria-colcount={flatHeaders.length}
      >
        <div
          className="w-full min-w-0"
          style={minTableWidth ? { minWidth: `${minTableWidth}px` } : undefined}
        >
          {/* Header fixo (sticky) - sólido, não transparente */}
          <div
            className="sticky top-0 z-20 shrink-0 flex items-stretch border-b border-border bg-card shadow-[0_2px_4px_-1px_rgba(0,0,0,0.06),0_2px_4px_-2px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.2),0_2px_4px_-2px_rgba(0,0,0,0.15)]"
            style={{ minHeight: '48px' }}
            role="row"
          >
            {flatHeaders.map((header) => {
              const meta = getColumnMeta(header.column);
              const canSort = header.column.getCanSort();
              const isSorted = header.column.getIsSorted();
              const hideOnMobile = meta?.hideOnMobile ?? false;
              return (
                <div
                  key={header.id}
                  className={cn(
                    'px-3 py-2 flex items-center gap-1 text-muted-foreground font-medium text-sm border-r border-border last:border-r-0 overflow-visible min-w-0 isolate',
                    cellAlignClass(meta?.align),
                    hideOnMobile && 'hidden md:flex',
                    canSort && 'cursor-pointer select-none hover:bg-muted'
                  )}
                  style={{
                    flex: getFlexStyle(meta),
                  }}
                  role="columnheader"
                  onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                >
                  <span className="whitespace-nowrap" title={typeof header.column.columnDef.header === 'string' ? header.column.columnDef.header : undefined}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </span>
                  {canSort && (
                    <span className="shrink-0" aria-hidden>
                      {isSorted === 'asc' ? ' ↑' : isSorted === 'desc' ? ' ↓' : ' ⇅'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {!scrollReady ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              Carregando…
            </div>
          ) : (
            <div
              style={{
                height: `${totalSize}px`,
                width: '100%',
                position: 'relative',
              }}
              role="rowgroup"
            >
              {virtualItems.map((virtualRow) => {
                const row = rows[virtualRow.index] as Row<T>;
                const cells = row.getVisibleCells();
                return (
                  <div
                    key={row.id}
                    data-index={virtualRow.index}
                    role="row"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      minHeight: `${rowHeight}px`,
                      height: `${rowHeight}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                      display: 'flex',
                      alignItems: 'center',
                      borderBottom: '1px solid hsl(var(--border))',
                    }}
                    className="hover:bg-muted/50 transition-colors bg-card"
                  >
                    {cells.map((cell) => {
                      const meta = getColumnMeta(cell.column);
                      const hideOnMobile = meta?.hideOnMobile ?? false;
                      return (
                        <div
                          key={cell.id}
                          role="cell"
                          className={cn(
                            'px-3 py-2 text-sm text-foreground flex items-center min-w-0 isolate',
                            hideOnMobile && 'hidden md:flex'
                          )}
                          style={{
                            flex: getFlexStyle(meta),
                            minWidth: 0,
                          }}
                        >
                          <span
                            className={cn(
                              'w-full min-w-0 block overflow-visible',
                              meta?.align === 'right' && 'text-right',
                              meta?.align === 'center' && 'text-center',
                              (meta?.align === 'left' || !meta?.align) && 'text-left'
                            )}
                            style={{ minWidth: 0 }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const VIRTUAL_SCROLL_ROW_HEIGHT = ROW_HEIGHT_DEFAULT;
export const VIRTUAL_SCROLL_MAX_HEIGHT = MAX_HEIGHT_DEFAULT;
