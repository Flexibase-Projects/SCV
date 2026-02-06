/**
 * Meta opcional para colunas do VirtualDataTable.
 * Aplicado em ColumnDef<T>['meta'] para largura, alinhamento e responsividade.
 */
export interface VirtualDataTableColumnMeta {
  /** Largura da coluna (ex: '90px', 'minmax(140px, 1fr)'). Usado como flexBasis. */
  width?: string;
  /** Alinhamento do conteúdo (text-right, text-left, justify-center). */
  align?: 'left' | 'right' | 'center';
  /** Se true, coluna fica oculta no mobile (hidden md:flex). */
  hideOnMobile?: boolean;
}
