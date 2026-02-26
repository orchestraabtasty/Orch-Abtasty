"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseBrowser } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Users, UserPlus, Trash2, Mail, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { TeamMember } from "@/types/test";

export default function SettingsPage() {
    const queryClient = useQueryClient();
    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newRole, setNewRole] = useState("");

    const { data: members, isLoading } = useQuery({
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

    return (
        <div className="container max-w-4xl py-10 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
                <p className="text-muted-foreground">Gérez votre équipe et les configurations de l'application.</p>
            </div>

            <div className="grid gap-8">
                {/* Team Management */}
                <Card className="border-border/40 shadow-sm bg-card/30 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            Membres de l'équipe
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
                                    {isLoading ? (
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
                                            <TableRow key={member.id}>
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
                        <CardTitle className="text-sm font-semibold opacity-70">Configuration API</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs space-y-2 opacity-60">
                        <p><strong>AB Tasty Account ID:</strong> {process.env.NEXT_PUBLIC_ABT_ACCOUNT_ID || "Configuré"}</p>
                        <p><strong>Dernière synchronisation:</strong> Temps réel (bidirectionnel)</p>
                        <p className="italic mt-4 text-[10px]">
                            Note: Pour modifier les clés API, veuillez mettre à jour votre fichier .env.local et redémarrer le serveur.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
