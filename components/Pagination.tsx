"use client";
import { Pagination as BSPagination, Form } from "react-bootstrap";

interface Props {
    page: number;
    totalPages: number;
    total: number;
    pageSize: number;
    onPage: (p: number) => void;
    onPageSize?: (n: number) => void;
    pageSizes?: number[];
}

export default function Pagination({ page, totalPages, total, pageSize, onPage, onPageSize, pageSizes = [10, 15, 25, 50] }: Props) {
    if (totalPages <= 1 && total <= pageSizes[0]) return null;

    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        pages.push(1);
        if (page > 3) pages.push("...");
        for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
        if (page < totalPages - 2) pages.push("...");
        pages.push(totalPages);
    }

    return (
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
            <div className="text-muted small">
                {total} enregistrement{total > 1 ? "s" : ""} — page {page}/{totalPages}
            </div>
            <div className="d-flex align-items-center gap-2">
                {onPageSize && (
                    <Form.Select size="sm" style={{ width: 80 }} value={pageSize} onChange={e => { onPageSize(Number(e.target.value)); onPage(1); }}>
                        {pageSizes.map(s => <option key={s} value={s}>{s}</option>)}
                    </Form.Select>
                )}
                <BSPagination size="sm" className="mb-0">
                    <BSPagination.Prev disabled={page === 1} onClick={() => onPage(page - 1)} />
                    {pages.map((p, i) =>
                        p === "..." ? <BSPagination.Ellipsis key={`e${i}`} disabled /> :
                        <BSPagination.Item key={p} active={p === page} onClick={() => onPage(p as number)}>{p}</BSPagination.Item>
                    )}
                    <BSPagination.Next disabled={page === totalPages} onClick={() => onPage(page + 1)} />
                </BSPagination>
            </div>
        </div>
    );
}
