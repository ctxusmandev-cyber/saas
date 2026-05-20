import { useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQueryClient } from "@tanstack/react-query";
import { useListRiders, useCreateRider, useUpdateRider, useDeleteRider, getListRidersQueryKey } from "@workspace/api-client-react";
import type { Rider } from "@workspace/api-client-react";
import { Bike, Plus, Pencil, Trash2, Phone, ToggleLeft, ToggleRight } from "lucide-react";

type FormState = { name: string; phone: string };
const empty: FormState = { name: "", phone: "" };

export default function AdminRiders() {
  const queryClient = useQueryClient();
  const { data: riders = [], isLoading } = useListRiders({ query: { queryKey: getListRidersQueryKey() } });

  const createRider = useCreateRider();
  const updateRider = useUpdateRider();
  const deleteRider = useDeleteRider();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Rider | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [deleteTarget, setDeleteTarget] = useState<Rider | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListRidersQueryKey() });

  const openAdd = () => { setEditing(null); setForm(empty); setDialogOpen(true); };
  const openEdit = (r: Rider) => { setEditing(r); setForm({ name: r.name, phone: r.phone }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.name.trim() || !form.phone.trim()) return;
    if (editing) {
      updateRider.mutate({ id: editing.id, data: form }, { onSuccess: () => { invalidate(); setDialogOpen(false); } });
    } else {
      createRider.mutate({ data: form }, { onSuccess: () => { invalidate(); setDialogOpen(false); setForm(empty); } });
    }
  };

  const toggleActive = (r: Rider) => {
    updateRider.mutate({ id: r.id, data: { active: !r.active } }, { onSuccess: invalidate });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteRider.mutate({ id: deleteTarget.id }, { onSuccess: () => { invalidate(); setDeleteTarget(null); } });
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold flex items-center gap-2">
              <Bike className="w-7 h-7 text-primary" />
              Delivery Riders
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your delivery team</p>
          </div>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Rider
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : riders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bike className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">No riders yet</h3>
            <p className="text-muted-foreground text-sm mt-1">Add your first delivery rider to start assigning orders.</p>
            <Button onClick={openAdd} className="mt-4 gap-2">
              <Plus className="w-4 h-4" /> Add First Rider
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {riders.map((rider) => (
                  <TableRow key={rider.id}>
                    <TableCell className="font-medium">{rider.name}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {rider.phone}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={rider.active
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                        }
                      >
                        {rider.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground"
                          title={rider.active ? "Deactivate" : "Activate"}
                          onClick={() => toggleActive(rider)}
                        >
                          {rider.active
                            ? <ToggleRight className="w-4 h-4 text-green-600" />
                            : <ToggleLeft className="w-4 h-4" />
                          }
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(rider)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget(rider)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => !v && setDialogOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Rider" : "Add New Rider"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                placeholder="e.g. Ahmed Khan"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number</Label>
              <Input
                placeholder="e.g. 0300-1234567"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleSave}
                disabled={!form.name.trim() || !form.phone.trim() || createRider.isPending || updateRider.isPending}
              >
                {editing ? "Save Changes" : "Add Rider"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Rider</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove <strong>{deleteTarget?.name}</strong>? This cannot be undone.
          </p>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteRider.isPending}>
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
