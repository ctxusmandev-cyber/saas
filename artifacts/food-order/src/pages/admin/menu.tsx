import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useListItems, useCreateItem, useUpdateItem, useDeleteItem, useListCategories, getListItemsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useRef } from "react";
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Upload, X, ImageIcon } from "lucide-react";
import { formatCurrency } from "@/lib/format";

const itemSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  imageUrl: z.string().optional().or(z.literal("")),
  categoryId: z.coerce.number().min(1, "Category is required"),
  available: z.boolean().default(true),
  featured: z.boolean().default(false),
  prepTimeMinutes: z.coerce.number().optional().nullable(),
});

type ItemFormValues = z.infer<typeof itemSchema>;

function ImageUploadField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || "");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be under 10 MB.");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const res = await fetch("/api/storage/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      const { uploadURL, objectPath } = await res.json();
      await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const serveUrl = `/api/storage${objectPath}`;
      setPreview(serveUrl);
      onChange(serveUrl);
    } catch {
      setError("Upload failed. Please try again.");
    }
    setUploading(false);
  };

  const clear = () => {
    setPreview("");
    onChange("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <div
        className={`relative border-2 border-dashed rounded-lg transition-colors ${
          uploading ? "opacity-60" : "hover:border-primary/50"
        } ${preview ? "border-transparent p-0" : "border-muted-foreground/30 p-4"}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        {preview ? (
          <div className="relative group">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-36 object-cover rounded-lg"
              onError={() => setPreview("")}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-8 text-xs gap-1.5"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="w-3 h-3" /> Replace
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="h-8 text-xs gap-1.5"
                onClick={clear}
              >
                <X className="w-3 h-3" /> Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
            <div className="text-sm text-muted-foreground">
              {uploading ? "Uploading…" : (
                <>
                  Drag & drop or{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline font-medium"
                    onClick={() => fileRef.current?.click()}
                  >
                    browse files
                  </button>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground/70">PNG, JPG, WebP · max 10 MB</p>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}

function ItemFormDialog({ 
  item, 
  categories,
  onClose 
}: { 
  item?: any, 
  categories: any[],
  onClose: () => void 
}) {
  const queryClient = useQueryClient();
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: item ? {
      name: item.name,
      description: item.description || "",
      price: item.price,
      imageUrl: item.imageUrl || "",
      categoryId: item.categoryId,
      available: item.available,
      featured: item.featured,
      prepTimeMinutes: item.prepTimeMinutes,
    } : {
      name: "",
      description: "",
      price: 0,
      imageUrl: "",
      categoryId: categories.length > 0 ? categories[0].id : 0,
      available: true,
      featured: false,
      prepTimeMinutes: 15,
    },
  });

  const onSubmit = (data: ItemFormValues) => {
    const payload = {
      ...data,
      imageUrl: data.imageUrl || undefined,
      prepTimeMinutes: data.prepTimeMinutes || undefined,
    };

    if (item) {
      updateItem.mutate(
        { id: item.id, data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() });
            onClose();
          }
        }
      );
    } else {
      createItem.mutate(
        { data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() });
            onClose();
          }
        }
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="E.g. Truffle Pasta" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={(val) => field.onChange(parseInt(val, 10))} defaultValue={field.value.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (Rs)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Item description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Item Image</FormLabel>
                <FormControl>
                  <ImageUploadField
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="col-span-2 flex justify-between p-4 border rounded-lg bg-muted/20">
            <FormField
              control={form.control}
              name="available"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="cursor-pointer">Available</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="featured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="cursor-pointer">Featured</FormLabel>
                </FormItem>
              )}
            />
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={createItem.isPending || updateItem.isPending}>
            {item ? "Save Changes" : "Create Item"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function AdminMenuItems() {
  const { data: items, isLoading } = useListItems();
  const { data: categories = [] } = useListCategories();
  const deleteItem = useDeleteItem();
  const updateItem = useUpdateItem();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    if (categories.length === 0) {
      alert("Please create a category first before adding items.");
      return;
    }
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this item?")) {
      deleteItem.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() });
          }
        }
      );
    }
  };

  const toggleAvailability = (item: any) => {
    updateItem.mutate(
      { id: item.id, data: { available: !item.available } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() });
        }
      }
    );
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold">Menu Items</h1>
            <p className="text-xs text-muted-foreground mt-1">{items?.length ?? 0} items</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" /> Add Item</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Menu Item" : "Add New Menu Item"}</DialogTitle>
              </DialogHeader>
              <ItemFormDialog 
                item={editingItem} 
                categories={categories}
                onClose={() => setIsDialogOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-card rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-10 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 mx-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : items?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No menu items found.
                  </TableCell>
                </TableRow>
              ) : (
                items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded object-cover border" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-muted-foreground/40" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{item.name}</div>
                      {item.featured && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase font-bold">Featured</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.categoryName}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(item.price)}</TableCell>
                    <TableCell className="text-center">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => toggleAvailability(item)}
                        className={item.available ? "text-green-600 hover:text-green-700 hover:bg-green-100" : "text-red-500 hover:text-red-600 hover:bg-red-100"}
                      >
                        {item.available ? <CheckCircle2 className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                        {item.available ? "Available" : "Sold Out"}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
