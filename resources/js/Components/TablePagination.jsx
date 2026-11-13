import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Standardized Table Pagination Component for ELFAA Platform
 *
 * @param {number} currentPage - Current 1-based page number
 * @param {number} totalItems - Total count of matching items
 * @param {number} pageSize - Number of items displayed per page
 * @param {function} onPageChange - Callback when page changes (newPage: number)
 * @param {function} [onPageSizeChange] - Callback when page size changes (newSize: number)
 * @param {number[]} [pageSizeOptions] - List of available page size options
 * @param {boolean} [showPageSize=true] - Whether to show the rows-per-page dropdown
 * @param {string} [className] - Optional custom container classes
 */
export default function TablePagination({
    currentPage = 1,
    totalItems = 0,
    pageSize = 10,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 25, 50, 100],
    showPageSize = true,
    className = '',
}) {
    const totalPages = Math.max(1, Math.ceil(totalItems / Math.max(1, pageSize)));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);

    const fromItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
    const toItem = Math.min(totalItems, safePage * pageSize);

    const isFirstPage = safePage <= 1;
    const isLastPage = safePage >= totalPages;

    const handlePageClick = (page) => {
        const clamped = Math.min(Math.max(1, page), totalPages);
        if (clamped !== safePage && onPageChange) {
            onPageChange(clamped);
        }
    };

    return (
        <div
            className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40 text-xs font-semibold text-zinc-600 dark:text-zinc-400 select-none transition-colors ${className}`}
        >
            {/* Left section: Records count & Page size selector */}
            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    Showing <strong className="text-zinc-900 dark:text-white font-extrabold">{fromItem}</strong> to{' '}
                    <strong className="text-zinc-900 dark:text-white font-extrabold">{toItem}</strong> of{' '}
                    <strong className="text-zinc-900 dark:text-white font-extrabold">{totalItems}</strong> records
                </span>

                {showPageSize && onPageSizeChange && (
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-black">
                            Rows:
                        </span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                const newSize = Number(e.target.value);
                                onPageSizeChange(newSize);
                                if (onPageChange) onPageChange(1);
                            }}
                            className="h-7 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 py-0 text-[11px] font-bold text-zinc-900 dark:text-white focus:border-[#FF3B30] focus:ring-0 cursor-pointer shadow-xs"
                            aria-label="Rows per page"
                        >
                            {pageSizeOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt} / page
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Right section: Page status & Navigation controls */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Page <span className="font-black text-[#FF3B30]">{safePage}</span> of{' '}
                    <span className="font-extrabold text-zinc-900 dark:text-white">{totalPages}</span>
                </span>

                <div className="flex items-center gap-1">
                    {/* First page button */}
                    <button
                        type="button"
                        onClick={() => handlePageClick(1)}
                        disabled={isFirstPage}
                        title="First Page"
                        aria-label="First Page"
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border transition-all ${
                            isFirstPage
                                ? 'opacity-30 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400'
                                : 'cursor-pointer bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-750 text-zinc-800 dark:text-zinc-200 hover:border-zinc-300 shadow-2xs active:scale-95'
                        }`}
                    >
                        <ChevronsLeft className="w-3.5 h-3.5" />
                    </button>

                    {/* Previous button */}
                    <button
                        type="button"
                        onClick={() => handlePageClick(safePage - 1)}
                        disabled={isFirstPage}
                        className={`inline-flex items-center gap-1 px-2.5 h-7 rounded-lg border text-xs font-bold transition-all ${
                            isFirstPage
                                ? 'opacity-30 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400'
                                : 'cursor-pointer bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-750 text-zinc-800 dark:text-zinc-200 hover:border-zinc-300 shadow-2xs active:scale-95'
                        }`}
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Prev</span>
                    </button>

                    {/* Current Page Pill */}
                    <span className="px-2.5 h-7 inline-flex items-center justify-center rounded-lg bg-[#FF3B30] text-white text-xs font-black shadow-xs">
                        {safePage}
                    </span>

                    {/* Next button */}
                    <button
                        type="button"
                        onClick={() => handlePageClick(safePage + 1)}
                        disabled={isLastPage}
                        className={`inline-flex items-center gap-1 px-2.5 h-7 rounded-lg border text-xs font-bold transition-all ${
                            isLastPage
                                ? 'opacity-30 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400'
                                : 'cursor-pointer bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-750 text-zinc-800 dark:text-zinc-200 hover:border-zinc-300 shadow-2xs active:scale-95'
                        }`}
                    >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Last page button */}
                    <button
                        type="button"
                        onClick={() => handlePageClick(totalPages)}
                        disabled={isLastPage}
                        title="Last Page"
                        aria-label="Last Page"
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border transition-all ${
                            isLastPage
                                ? 'opacity-30 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400'
                                : 'cursor-pointer bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-750 text-zinc-800 dark:text-zinc-200 hover:border-zinc-300 shadow-2xs active:scale-95'
                        }`}
                    >
                        <ChevronsRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
