import { useEffect, useState } from "react";
import Button from "../ui/button/Button";

export const PAGE_SIZE_PRESETS = [10, 25, 50, 100, 200] as const;
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 500;

function clampPageSize(n: number) {
  if (!Number.isFinite(n) || n < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.floor(n), MAX_PAGE_SIZE);
}

function isPresetSize(size: number) {
  return (PAGE_SIZE_PRESETS as readonly number[]).includes(size);
}

export function ListPageSizeSelect({
  pageSize,
  onChange,
  maxPageSize = MAX_PAGE_SIZE,
}: {
  pageSize: number;
  onChange: (size: number) => void;
  maxPageSize?: number;
}) {
  const [customMode, setCustomMode] = useState(!isPresetSize(pageSize));
  const [customInput, setCustomInput] = useState(
    isPresetSize(pageSize) ? "" : String(pageSize)
  );
  const selectValue = customMode ? "custom" : String(pageSize);

  useEffect(() => {
    const preset = isPresetSize(pageSize);
    setCustomMode(!preset);
    if (!preset) setCustomInput(String(pageSize));
  }, [pageSize]);

  function applyCustom() {
    const n = clampPageSize(Number(customInput));
    const capped = Math.min(n, maxPageSize);
    onChange(capped);
    setCustomInput(String(capped));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-500 dark:text-gray-400">Show</span>
      <select
        className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
        value={selectValue}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "custom") {
            setCustomMode(true);
            setCustomInput(isPresetSize(pageSize) ? String(pageSize) : String(pageSize));
            return;
          }
          setCustomMode(false);
          onChange(clampPageSize(Number(v)));
        }}
      >
        {PAGE_SIZE_PRESETS.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
        <option value="custom">Custom…</option>
      </select>
      {customMode ? (
        <>
          <input
            type="number"
            min={1}
            max={maxPageSize}
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyCustom();
              }
            }}
            placeholder={`1–${maxPageSize}`}
            className="h-10 w-24 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
          <Button size="sm" variant="outline" onClick={applyCustom}>
            Apply
          </Button>
        </>
      ) : null}
      <span className="text-sm text-gray-500 dark:text-gray-400">entries</span>
    </div>
  );
}

export function TablePaginationFooter({
  page,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const rangeStart = totalCount ? (page - 1) * pageSize + 1 : 0;
  const rangeEnd = totalCount ? Math.min(page * pageSize, totalCount) : 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-3 dark:border-white/[0.05]">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Showing {rangeStart} to {rangeEnd} of {totalCount} entries
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="text-sm text-gray-600 dark:text-gray-300">
          Page {page} of {totalPages}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export function buildPageQuery(page: number, pageSize: number) {
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("page_size", String(clampPageSize(pageSize)));
  return `?${qs.toString()}`;
}
