import type { PaginationMeta } from '../../models/types';
import { Icon } from './Icon';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  const from = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);

  return (
    <nav className="pagination" aria-label="Paginación">
      <span className="pagination__info">
        {from}–{to} de {meta.total}
      </span>
      <div className="pagination__controls">
        <button
          className="icon-btn"
          onClick={() => onPageChange(meta.page - 1)}
          disabled={meta.page <= 1}
          aria-label="Página anterior"
        >
          <Icon name="chevronLeft" size={18} />
        </button>
        <span className="pagination__page">
          {meta.page} / {meta.totalPages}
        </span>
        <button
          className="icon-btn"
          onClick={() => onPageChange(meta.page + 1)}
          disabled={meta.page >= meta.totalPages}
          aria-label="Página siguiente"
        >
          <Icon name="chevronRight" size={18} />
        </button>
      </div>
    </nav>
  );
}
