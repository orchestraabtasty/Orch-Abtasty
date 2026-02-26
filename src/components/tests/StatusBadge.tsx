import { getStatusColor, getStatusLabel } from "@/lib/status-mapping";
import type { InternalStatus } from "@/types/test";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
    status: InternalStatus;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const colorClasses = getStatusColor(status);
    const label = getStatusLabel(status);

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-colors",
                colorClasses,
                className
            )}
        >
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
            {label}
        </span>
    );
}
