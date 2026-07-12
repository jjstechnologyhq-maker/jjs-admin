"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Footer controls for cursor-paginated lists. Cursors are opaque, so we expose
 * page-at-a-time Prev/Next rather than jump-to-page. `total` is display-only.
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
}: {
  page: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  total?: number;
  isFetching?: boolean;
  itemLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="text-sm text-muted-foreground">
        {total !== undefined
          ? `${total.toLocaleString()} ${itemLabel}${total === 1 ? "" : "s"}`
          : ""}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Page {page}</span>
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
