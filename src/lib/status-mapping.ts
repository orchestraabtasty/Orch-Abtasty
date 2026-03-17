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

/**
 * Returns Tailwind classes for a left border by internal status (cards, list rows).
 */
export function getStatusBorderLeftClass(status: InternalStatus | undefined): string {
    const borders: Record<InternalStatus, string> = {
        idea: "border-l-4 border-l-gray-500",
        creating: "border-l-4 border-l-blue-500",
        staging: "border-l-4 border-l-amber-500",
        live: "border-l-4 border-l-green-500",
        done: "border-l-4 border-l-purple-500",
    };
    return status ? borders[status] ?? "border-l-4 border-l-gray-400" : "border-l-4 border-l-gray-400";
}

// ─── TYPE-BASED COLORS ────────────────────────────────────────────────────────

const TYPE_COLOR_MAP: Record<string, string> = {
    ab: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    patch: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    multipage: "bg-violet-500/15 text-violet-400 border-violet-500/30",
    split: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    redirect: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    server_side: "bg-teal-500/15 text-teal-400 border-teal-500/30",
    personalization: "bg-pink-500/15 text-pink-400 border-pink-500/30",
    idee: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

const TYPE_BORDER_MAP: Record<string, string> = {
    ab: "border-l-4 border-l-blue-500",
    patch: "border-l-4 border-l-orange-500",
    multipage: "border-l-4 border-l-violet-500",
    split: "border-l-4 border-l-cyan-500",
    redirect: "border-l-4 border-l-yellow-500",
    server_side: "border-l-4 border-l-teal-500",
    personalization: "border-l-4 border-l-pink-500",
    idee: "border-l-4 border-l-amber-500",
};

const TYPE_BADGE_MAP: Record<string, string> = {
    ab: "bg-blue-500",
    patch: "bg-orange-500",
    multipage: "bg-violet-500",
    split: "bg-cyan-500",
    redirect: "bg-yellow-500",
    server_side: "bg-teal-500",
    personalization: "bg-pink-500",
    idee: "bg-amber-500",
};

/** Returns Tailwind badge color classes for a given test type. */
export function getTypeColor(type: string | null | undefined): string {
    if (!type) return "bg-gray-500/15 text-gray-400 border-gray-500/30";
    return TYPE_COLOR_MAP[type.toLowerCase()] ?? "bg-gray-500/15 text-gray-400 border-gray-500/30";
}

/** Returns Tailwind left-border classes for a given test type. */
export function getTypeBorderLeftClass(type: string | null | undefined): string {
    if (!type) return "border-l-4 border-l-gray-500";
    return TYPE_BORDER_MAP[type.toLowerCase()] ?? "border-l-4 border-l-gray-500";
}

/** Returns the Tailwind bg color for a type dot indicator. */
export function getTypeDotClass(type: string | null | undefined): string {
    if (!type) return "bg-gray-500";
    return TYPE_BADGE_MAP[type.toLowerCase()] ?? "bg-gray-500";
}

// ─── ABT STATUS COLORS ────────────────────────────────────────────────────────

/** Returns Tailwind classes for Timeline bars: background + border only (no text color).
 *  Use text-foreground on the bar content so the ID/label stays lisible en light et dark mode. */
export function getAbtStatusColor(abtStatus: string | null | undefined): string {
    if (!abtStatus) return "bg-gray-500/30 border-gray-500/40";
    const map: Record<string, string> = {
        play: "bg-green-500/30 border-green-600/50",
        active: "bg-green-500/30 border-green-600/50",
        pause: "bg-amber-500/30 border-amber-600/50",
        paused: "bg-amber-500/30 border-amber-600/50",
        stopped: "bg-gray-500/30 border-gray-600/50",
        interrupted: "bg-red-500/30 border-red-600/50",
        in_qa: "bg-blue-500/30 border-blue-600/50",
        scheduled: "bg-cyan-500/30 border-cyan-600/50",
        archive: "bg-gray-500/20 border-gray-500/40",
        draft: "bg-slate-500/30 border-slate-600/50",
    };
    return map[abtStatus.toLowerCase()] ?? "bg-gray-500/30 border-gray-600/50";
}

/**
 * Returns the display label for AB Tasty status (abt_status).
 */
export function getAbtStatusLabel(abtStatus: string | null): string {
    if (!abtStatus) return "—";
    const labels: Record<string, string> = {
        play: "En cours",
        pause: "Pause",
        active: "En cours",
        paused: "Pause",
        stopped: "Arrêté",
        interrupted: "Interrompu",
        in_qa: "En QA",
        scheduled: "Planifié",
        archive: "Archivé",
        draft: "Brouillon",
    };
    return labels[abtStatus.toLowerCase()] ?? abtStatus;
}

export const ALL_STATUSES: InternalStatus[] = [
    "idea",
    "creating",
    "staging",
    "live",
    "done",
];

/**
 * Returns true when the test's temporal period is locked and cannot be edited manually.
 * - "play"    → test is live, end date = today (open-ended, read-only).
 * - "stopped" → test is finished, period is frozen.
 */
export function isTestPeriodLocked(abtStatus: string | null | undefined): boolean {
    if (!abtStatus) return false;
    return abtStatus === "play" || abtStatus === "stopped";
}
