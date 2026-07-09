import { useState, useMemo } from "react";

export function usePagination<T>(items: T[], pageSize = 15) {
    const [page, setPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const pageCourante = Math.min(page, totalPages);

    const slice = useMemo(
        () => items.slice((pageCourante - 1) * pageSize, pageCourante * pageSize),
        [items, pageCourante, pageSize]
    );

    const reset = () => setPage(1);

    return { slice, page: pageCourante, totalPages, setPage, reset, total: items.length };
}
