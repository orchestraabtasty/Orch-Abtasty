import { getTypeColor } from "@/lib/status-mapping";
import { cn } from "@/lib/utils";

interface TypeBadgeProps {
    type: string | null | undefined;
    className?: string;
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
    const colorClasses = getTypeColor(type);
    const label = type ? type.toUpperCase() : "N/A";

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
