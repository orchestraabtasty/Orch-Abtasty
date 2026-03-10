"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Users, Mail, Shield, ShieldCheck, Clock, CheckCircle, XCircle, RefreshCw, UserCog, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface UserProfile {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    status: "pending" | "approved" | "rejected";
    created_at: string;
}

const ROLE_CONFIG: Record<UserRole, { label: string; className: string; icon: React.ReactNode }> = {
    super_admin: {
        label: "Super Admin",
        className: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
        icon: <ShieldCheck className="h-3 w-3" />,
    },
    admin: {
        label: "Admin",
        className: "bg-primary/15 text-primary border-primary/30",
        icon: <Shield className="h-3 w-3" />,
    },
    member: {
        label: "Membre",
        className: "bg-muted text-muted-foreground border-border/50",
        icon: <Users className="h-3 w-3" />,
    },
    view: {
        label: "Lecture seule",
        className: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
        icon: <Eye className="h-3 w-3" />,
    },
};

export default function SettingsPage() {
    const queryClient = useQueryClient();
    const { profile: currentProfile } = useAuth();

    const isAdmin = currentProfile?.role === "admin" || currentProfile?.role === "super_admin";

    // ── Profils utilisateurs (admin seulement) ─────────────────────────
    const { data: profiles, isLoading: isLoadingProfiles } = useQuery({
        queryKey: ["admin-profiles"],
        queryFn: async () => {
            const res = await fetch("/api/admin/profiles");
            if (!res.ok) throw new Error("Erreur lors du chargement des profils");
            const json = await res.json();
            return json.data as UserProfile[];
        },
        enabled: isAdmin,
    });

    const pendingProfiles = profiles?.filter((p) => p.status === "pending") ?? [];
    const allProfiles = profiles ?? [];

    const updateProfile = useMutation({
        mutationFn: async ({ id, status, role }: { id: string; status?: string; role?: string }) => {
            const res = await fetch(`/api/admin/profiles/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, role }),
            });
            if (!res.ok) throw new Error("Erreur lors de la mise à jour");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
        },
        onError: (err) => toast.error(`Erreur: ${err.message}`),
    });

    const handleApprove = (id: string) => {
        updateProfile.mutate({ id, status: "approved" });
        toast.success("Compte approuvé !");
    };

    const handleReject = (id: string) => {
        updateProfile.mutate({ id, status: "rejected" });
        toast.info("Compte refusé.");
    };

    const handleChangeRole = (profile: UserProfile, newRole: UserRole) => {
        if (newRole === profile.role) return;
        updateProfile.mutate({ id: profile.id, role: newRole });
        toast.success(`Rôle mis à jour : ${ROLE_CONFIG[newRole].label}`);
    };

    /** Rôles qu'un admin peut assigner (sans super_admin, réservé au super_admin) */
    const assignableRoles = (currentProfile?.role === "super_admin"
        ? (["super_admin", "admin", "member", "view"] as UserRole[])
        : (["admin", "member", "view"] as UserRole[])
    );

    /** Peut-on modifier le rôle d'un profil donné ? */
    const canEditRole = (p: UserProfile) => {
        if (p.id === currentProfile?.id) return false;
        if (p.role === "super_admin" && currentProfile?.role !== "super_admin") return false;
        return true;
    };

    const deleteUser = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/admin/profiles/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                throw new Error(json.error ?? "Erreur lors de la suppression");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
            toast.success("Utilisateur supprimé.");
        },
        onError: (err) => toast.error(`Erreur : ${err.message}`),
    });

    const handleDelete = (profile: UserProfile) => {
        if (!confirm(`Supprimer définitivement le compte de ${profile.name ?? profile.email} ? Cette action est irréversible.`)) return;
        deleteUser.mutate(profile.id);
    };

    const statusConfig = {
        pending: { label: "En attente", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" },
        approved: { label: "Approuvé", className: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30" },
        rejected: { label: "Refusé", className: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30" },
    };

    const isAdminSection = isAdmin;

    return (
        <div className="container max-w-4xl py-10 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
                <p className="text-muted-foreground">Gérez votre équipe et les configurations de l&apos;application.</p>
            </div>

            <div className="grid gap-8">
                {/* ── Utilisateurs en attente (admin only) ─────────────────── */}
                {isAdminSection && pendingProfiles.length > 0 && (
                    <Card className="border-amber-500/30 bg-amber-500/5 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                <Clock className="w-5 h-5" />
                                Comptes en attente de validation
                                <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold">
                                    {pendingProfiles.length}
                                </Badge>
                            </CardTitle>
                            <CardDescription>
                                Ces utilisateurs ont créé un compte et attendent votre validation pour accéder à l&apos;application.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border border-amber-500/20">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nom</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Inscrit le</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingProfiles.map((p) => (
                                            <TableRow key={p.id}>
                                                <TableCell className="font-medium">{p.name ?? "—"}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1.5">
                                                        <Mail className="w-3 h-3" />
                                                        {p.email}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {format(new Date(p.created_at), "dd MMM yyyy", { locale: fr })}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 text-xs border-green-500/40 text-green-600 dark:text-green-400 hover:bg-green-500/10"
                                                            onClick={() => handleApprove(p.id)}
                                                            disabled={updateProfile.isPending}
                                                        >
                                                            <CheckCircle className="mr-1 h-3.5 w-3.5" />
                                                            Approuver
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 text-xs border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                                                            onClick={() => handleReject(p.id)}
                                                            disabled={updateProfile.isPending}
                                                        >
                                                            <XCircle className="mr-1 h-3.5 w-3.5" />
                                                            Refuser
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleDelete(p)}
                                                            disabled={deleteUser.isPending}
                                                            title="Supprimer définitivement"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ── Gestion des utilisateurs (admin only) ─────────────────── */}
                {isAdminSection && (
                    <Card className="border-border/40 shadow-sm bg-card/30 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserCog className="w-5 h-5 text-primary" />
                                Gestion des utilisateurs
                            </CardTitle>
                            <CardDescription>
                                Gérez les accès et les rôles de tous les utilisateurs.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingProfiles ? (
                                <p className="text-sm text-muted-foreground text-center py-4">Chargement...</p>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nom</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Rôle</TableHead>
                                                <TableHead>Statut</TableHead>
                                                <TableHead className="w-[100px]">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {allProfiles.map((p) => (
                                                <TableRow key={p.id}>
                                                    <TableCell className="font-medium">{p.name ?? "—"}</TableCell>
                                                    <TableCell className="text-sm text-muted-foreground truncate max-w-[160px]">
                                                        {p.email}
                                                    </TableCell>
                                                    <TableCell>
                                                        {canEditRole(p) ? (
                                                            <Select
                                                                value={p.role}
                                                                onValueChange={(val) => handleChangeRole(p, val as UserRole)}
                                                                disabled={updateProfile.isPending}
                                                            >
                                                                <SelectTrigger className={cn(
                                                                    "h-7 w-auto min-w-[130px] text-xs font-medium border rounded-full px-2 py-0.5 gap-1.5",
                                                                    ROLE_CONFIG[p.role].className
                                                                )}>
                                                                    <SelectValue>
                                                                        <span className="flex items-center gap-1">
                                                                            {ROLE_CONFIG[p.role].icon}
                                                                            {ROLE_CONFIG[p.role].label}
                                                                        </span>
                                                                    </SelectValue>
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {assignableRoles.map((r) => (
                                                                        <SelectItem key={r} value={r}>
                                                                            <span className="flex items-center gap-1.5 text-xs">
                                                                                {ROLE_CONFIG[r].icon}
                                                                                {ROLE_CONFIG[r].label}
                                                                            </span>
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        ) : (
                                                            <span className={cn(
                                                                "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border",
                                                                ROLE_CONFIG[p.role].className
                                                            )}>
                                                                {ROLE_CONFIG[p.role].icon}
                                                                {ROLE_CONFIG[p.role].label}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={cn(
                                                            "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border",
                                                            statusConfig[p.status].className
                                                        )}>
                                                            {p.status === "pending" && <Clock className="h-3 w-3" />}
                                                            {p.status === "approved" && <CheckCircle className="h-3 w-3" />}
                                                            {p.status === "rejected" && <XCircle className="h-3 w-3" />}
                                                            {statusConfig[p.status].label}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1">
                                                            {p.status !== "approved" && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-green-600 dark:text-green-400"
                                                                    onClick={() => handleApprove(p.id)}
                                                                    title="Approuver"
                                                                >
                                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                            {p.status !== "rejected" && p.id !== currentProfile?.id && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-red-600 dark:text-red-400"
                                                                    onClick={() => handleReject(p.id)}
                                                                    title="Refuser"
                                                                >
                                                                    <XCircle className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                            {p.id !== currentProfile?.id && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                                    onClick={() => handleDelete(p)}
                                                                    disabled={deleteUser.isPending}
                                                                    title="Supprimer définitivement"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* API Info Card */}
                <Card className="border-primary/10 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold opacity-70 flex items-center gap-2">
                            <RefreshCw className="w-4 h-4" />
                            Configuration API
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2 opacity-60">
                        <p><strong>AB Tasty Account ID:</strong> {process.env.NEXT_PUBLIC_ABT_ACCOUNT_ID || "Configuré"}</p>
                        <p><strong>Dernière synchronisation:</strong> Temps réel (bidirectionnel)</p>
                        <p className="italic mt-4 text-xs">
                            Note: Pour modifier les clés API, veuillez mettre à jour votre fichier .env.local et redémarrer le serveur.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
