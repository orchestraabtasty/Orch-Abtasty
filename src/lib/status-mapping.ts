import type { InternalStatus } from "@/types/test";
import type { AbtCampaignStatus } from "@/types/abtasty";

/**
 * Maps AB Tasty campaign status to internal Orch-Abtasty status.
 * Statuses without direct ABT mapping (idea, creating, staging) are managed manually in Supabase.
 */
export function mapAbtToInternal(
    abtStatus: AbtCampaignStatus
): InternalStatus | null {
    const mapping: Record<string, InternalStatus> = {
        active: "live",
        paused: "done",
        stopped: "done",
        archived: "done",
    };
    return mapping[abtStatus] ?? null;
}

/**
 * Maps internal status to AB Tasty campaign status for write operations.
 * Only statuses that have an ABT equivalent can be synced back.
 * Returns null if there's no direct ABT equivalent.
 */
export function mapInternalToAbt(
    internalStatus: InternalStatus
): AbtCampaignStatus | null {
    const mapping: Record<InternalStatus, AbtCampaignStatus | null> = {
        idea: null,
        creating: null,
        staging: null,
        live: "active",
        done: "stopped",
    };
    return mapping[internalStatus] ?? null;
}

/**
 * Returns the display label for an internal status.
 */
export function getStatusLabel(status: InternalStatus): string {
    const labels: Record<InternalStatus, string> = {
        idea: "Idée",
        creating: "En cours de création",
        staging: "En recette",
        live: "Live",
        done: "Terminé",
    };
    return labels[status];
}

/**
 * Returns the Tailwind CSS color class for a status badge.
 */
export function getStatusColor(status: InternalStatus): string {
    const colors: Record<InternalStatus, string> = {
        idea: "bg-gray-500/15 text-gray-400 border-gray-500/30",
        creating: "bg-blue-500/15 text-blue-400 border-blue-500/30",
        staging: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        live: "bg-green-500/15 text-green-400 border-green-500/30",
        done: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    };
    return colors[status];
}

export const ALL_STATUSES: InternalStatus[] = [
    "idea",
    "creating",
    "staging",
    "live",
    "done",
];
