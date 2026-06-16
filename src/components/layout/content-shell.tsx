/**
 * ContentShell — consistent page wrapper
 * Provides page title, breadcrumb, and action area for all dashboard pages
 */

interface ContentShellProps {
  /** Page title displayed at the top */
  title: string;
  /** Optional description below the title */
  description?: string;
  /** Optional action buttons (top-right) */
  actions?: React.ReactNode;
  /** Page content */
  children: React.ReactNode;
}

export function ContentShell({
  title,
  description,
  actions,
  children,
}: ContentShellProps) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6 lg:p-8">
      {/* Page header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Content */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
