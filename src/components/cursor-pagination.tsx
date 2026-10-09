"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Footer controls for paginated lists.
 *
 * Server lists are cursor-paginated (opaque cursors → Prev/Next only). Client
 * lists (endpoints that return full arrays) can also pass `pageCount` to show
 * "Page X of Y". `total` is display-only.
 */
export function CursorPagination({
  page,
  canPrev,
  canNext,
  onPrev,
  onNext,
  total,
  isFetching,
  itemLabel = "item",
  pageCount,
}: {
  page: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  total?: number;
  isFetching?: boolean;
  itemLabel?: string;
  /** Total number of pages, for client-side (non-cursor) pagination. */
  pageCount?: number;
}) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="text-sm text-muted-foreground">
        {total !== undefined
          ? `${total.toLocaleString()} ${itemLabel}${total === 1 ? "" : "s"}`
          : ""}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">
          Page {page}
          {pageCount !== undefined ? ` of ${pageCount}` : ""}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={onPrev}
            disabled={!canPrev || isFetching}
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={onNext}
            disabled={!canNext || isFetching}
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
