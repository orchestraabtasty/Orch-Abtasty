"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseBrowser } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Users, UserPlus, Trash2, Mail, Shield, Clock, CheckCircle, XCircle, RefreshCw, UserCog } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { TeamMember } from "@/types/test";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface UserProfile {
    id: string;
    email: string;
    name: string | null;
    role: "admin" | "member";
    status: "pending" | "approved" | "rejected";
    created_at: string;
}

export default function SettingsPage() {
    const queryClient = useQueryClient();
    const { profile: currentProfile } = useAuth();

    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newRole, setNewRole] = useState("");

    // ── Membres d'équipe (team_members) ──────────────────────────────────
    const { data: members, isLoading: isLoadingMembers } = useQuery({
        queryKey: ["team-members"],
        queryFn: async () => {
            const { data, error } = await supabaseBrowser
                .from("team_members")
                .select("*")
                .order("name");
            if (error) throw error;
            return data as TeamMember[];
        },
    });

    const addMember = useMutation({
        mutationFn: async () => {
            if (!newName) throw new Error("Le nom est requis");
            const { error } = await supabaseBrowser.from("team_members").insert([
                { name: newName, email: newEmail || null, role: newRole || null },
            ]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team-members"] });
            setNewName("");
            setNewEmail("");
            setNewRole("");
            toast.success("Membre ajouté !");
        },
        onError: (err) => toast.error(`Erreur: ${err.message}`),
    });

    const removeMember = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabaseBrowser.from("team_members").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team-members"] });
            toast.success("Membre supprimé.");
        },
    });

    // ── Profils utilisateurs (admin seulement) ─────────────────────────
    const { data: profiles, isLoading: isLoadingProfiles } = useQuery({
        queryKey: ["admin-profiles"],
        queryFn: async () => {
            const res = await fetch("/api/admin/profiles");
            if (!res.ok) throw new Error("Erreur lors du chargement des profils");
            const json = await res.json();
            return json.data as UserProfile[];
        },
        enabled: currentProfile?.role === "admin",
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

    const handleToggleRole = (profile: UserProfile) => {
        const newRole = profile.role === "admin" ? "member" : "admin";
        updateProfile.mutate({ id: profile.id, role: newRole });
        toast.success(`Rôle mis à jour : ${newRole === "admin" ? "Admin" : "Membre"}`);
    };

    const statusConfig = {
        pending: { label: "En attente", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" },
        approved: { label: "Approuvé", className: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30" },
        rejected: { label: "Refusé", className: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30" },
    };

    return (
        <div className="container max-w-4xl py-10 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
                <p className="text-muted-foreground">Gérez votre équipe et les configurations de l&apos;application.</p>
            </div>

            <div className="grid gap-8">
                {/* ── Utilisateurs en attente (admin only) ─────────────────── */}
                {currentProfile?.role === "admin" && pendingProfiles.length > 0 && (
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
                {currentProfile?.role === "admin" && (
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
                                                        <button
                                                            type="button"
                                                            onClick={() => p.id !== currentProfile?.id && handleToggleRole(p)}
                                                            className={cn(
                                                                "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border transition-colors",
                                                                p.role === "admin"
                                                                    ? "bg-primary/15 text-primary border-primary/30"
                                                                    : "bg-muted text-muted-foreground border-border/50",
                                                                p.id !== currentProfile?.id && "cursor-pointer hover:opacity-80"
                                                            )}
                                                            title={p.id === currentProfile?.id ? "Vous ne pouvez pas modifier votre propre rôle" : "Cliquer pour changer le rôle"}
                                                        >
                                                            {p.role === "admin" ? <Shield className="h-3 w-3" /> : null}
                                                            {p.role === "admin" ? "Admin" : "Membre"}
                                                        </button>
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

                {/* ── Team Management ──────────────────────────────────────── */}
                <Card className="border-border/40 shadow-sm bg-card/30 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            Membres de l&apos;équipe
                        </CardTitle>
                        <CardDescription>
                            Ajoutez les personnes qui pourront être assignées aux tests.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-3">
                            <Input
                                placeholder="Nom complet"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="flex-1"
                            />
                            <Input
                                placeholder="Email (optionnel)"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                className="flex-[1.5]"
                            />
                            <Input
                                placeholder="Rôle (ex: CRO, Product)"
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value)}
                                className="flex-1"
                            />
                            <Button onClick={() => addMember.mutate()} disabled={addMember.isPending}>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Ajouter
                            </Button>
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nom</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Rôle</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingMembers ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 opacity-50">
                                                Chargement...
                                            </TableCell>
                                        </TableRow>
                                    ) : !members || members.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                Aucun membre configuré.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        members.map((member) => (
                                            <TableRow key={member.id} className="group">
                                                <TableCell className="font-medium">{member.name}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {member.email ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <Mail className="w-3 h-3" />
                                                            {member.email}
                                                        </div>
                                                    ) : "-"}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {member.role ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <Shield className="w-3 h-3 opacity-50" />
                                                            {member.role}
                                                        </div>
                                                    ) : "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => removeMember.mutate(member.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

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
