'use client';

import { Pagination as BsPagination, Form } from 'react-bootstrap';

interface PaginationProps {
  currentPage?: number;
  page?: number;
  totalPages?: number;
  total?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPage?: (page: number) => void;
  onPageSize?: (size: number) => void;
}

export default function Pagination({
  currentPage,
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPage,
  onPageSize,
}: PaginationProps) {
  const activePage = currentPage ?? page ?? 1;
  const pagesCount = totalPages ?? 1;
  const handlePageChange = onPageChange ?? onPage;

  if (pagesCount <= 1 && !onPageSize) return null;

  const pages: (number | string)[] = [];
  const delta = 2;
  const start = Math.max(1, activePage - delta);
  const end = Math.min(pagesCount, activePage + delta);

  if (start > 1) pages.push(1);
  if (start > 2) pages.push('...');
  for (let i = start; i <= end; i += 1) pages.push(i);
  if (end < pagesCount - 1) pages.push('...');
  if (end < pagesCount) pages.push(pagesCount);

  return (
    <div className="d-flex justify-content-center align-items-center gap-3 mt-3 flex-wrap">
      {onPageSize && pageSize !== undefined && (
        <Form.Select
          value={String(pageSize)}
          onChange={(e) => onPageSize(Number(e.target.value))}
          style={{ width: 'auto' }}
        >
          <option value="20">20 lignes</option>
          <option value="50">50 lignes</option>
          <option value="75">75 lignes</option>
          <option value="100">100 lignes</option>
        </Form.Select>
      )}

      <BsPagination>
        <BsPagination.First onClick={() => handlePageChange?.(1)} disabled={activePage === 1} />
        <BsPagination.Prev onClick={() => handlePageChange?.(activePage - 1)} disabled={activePage === 1} />
        {pages.map((p, idx) => {
          if (p === '...') {
            return <BsPagination.Ellipsis key={idx} />;
          }
          return (
            <BsPagination.Item
              key={idx}
              active={p === activePage}
              onClick={() => handlePageChange?.(p as number)}
            >
              {p}
            </BsPagination.Item>
          );
        })}
        <BsPagination.Next onClick={() => handlePageChange?.(activePage + 1)} disabled={activePage === pagesCount} />
        <BsPagination.Last onClick={() => handlePageChange?.(pagesCount)} disabled={activePage === pagesCount} />
      </BsPagination>

      {total !== undefined && <span className="text-muted small">{total} résultat(s)</span>}
    </div>
  );
}
