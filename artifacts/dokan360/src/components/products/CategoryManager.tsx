import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  getListCategoriesQueryKey,
  getListProductsQueryKey,
  type Category,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, Tag, Check, X } from "lucide-react";

interface InlineEditState {
  id: number;
  nameBn: string;
  nameEn: string;
}

export function CategoryManager() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: categories, isLoading } = useListCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const [newNameBn, setNewNameBn] = useState("");
  const [newNameEn, setNewNameEn] = useState("");
  const [editState, setEditState] = useState<InlineEditState | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
    qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
  };

  /* ── Create ── */
  const handleCreate = () => {
    if (!newNameBn.trim()) {
      toast({ variant: "destructive", title: "বিভাগের নাম আবশ্যক" });
      return;
    }
    createMutation.mutate(
      { data: { nameBn: newNameBn.trim(), nameEn: newNameEn.trim() || null } },
      {
        onSuccess: () => {
          toast({ title: "বিভাগ তৈরি হয়েছে" });
          setNewNameBn("");
          setNewNameEn("");
          invalidate();
        },
        onError: () => toast({ variant: "destructive", title: "বিভাগ তৈরি ব্যর্থ" }),
      }
    );
  };

  /* ── Inline edit save ── */
  const handleEditSave = () => {
    if (!editState || !editState.nameBn.trim()) {
      toast({ variant: "destructive", title: "নাম আবশ্যক" });
      return;
    }
    updateMutation.mutate(
      {
        id: editState.id,
        data: { nameBn: editState.nameBn.trim(), nameEn: editState.nameEn.trim() || null },
      },
      {
        onSuccess: () => {
          toast({ title: "বিভাগ আপডেট হয়েছে" });
          setEditState(null);
          invalidate();
        },
        onError: () => toast({ variant: "destructive", title: "আপডেট ব্যর্থ" }),
      }
    );
  };

  /* ── Delete ── */
  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(
      { id: deleteId },
      {
        onSuccess: () => {
          toast({ title: "বিভাগ মুছে গেছে" });
          setDeleteId(null);
          invalidate();
        },
        onError: () => toast({ variant: "destructive", title: "মুছতে ব্যর্থ" }),
      }
    );
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Add new category ── */}
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-sm font-semibold">নতুন বিভাগ</CardTitle>
            <CardDescription className="text-xs">পণ্য শ্রেণীবদ্ধ করতে বিভাগ তৈরি করুন</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">নাম (বাংলা) <span className="text-destructive">*</span></Label>
              <Input
                placeholder="যেমন: খাদ্যপণ্য"
                value={newNameBn}
                onChange={(e) => setNewNameBn(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">নাম (ইংরেজি)</Label>
              <Input
                placeholder="e.g. Groceries"
                value={newNameEn}
                onChange={(e) => setNewNameEn(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <Button
              className="w-full gap-2"
              onClick={handleCreate}
              disabled={createMutation.isPending}
            >
              <Plus className="h-4 w-4" />
              {createMutation.isPending ? "তৈরি হচ্ছে..." : "বিভাগ তৈরি করুন"}
            </Button>
          </CardContent>
        </Card>

        {/* ── Category list ── */}
        <Card className="lg:col-span-2 border border-border/60 shadow-sm">
          <CardHeader className="pb-3 pt-5 px-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">সকল বিভাগ</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {(categories ?? []).length} টি বিভাগ
                </CardDescription>
              </div>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : (categories ?? []).length === 0 ? (
              <div className="flex flex-col items-center py-10 text-muted-foreground gap-2">
                <Tag className="h-8 w-8 opacity-25" />
                <p className="text-sm">কোনো বিভাগ নেই</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {(categories ?? []).map((cat: Category) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-colors"
                  >
                    {editState?.id === cat.id ? (
                      /* ── Inline edit mode ── */
                      <>
                        <div className="flex-1 flex gap-2 min-w-0">
                          <Input
                            className="h-7 text-sm"
                            value={editState?.nameBn ?? ""}
                            onChange={(e) =>
                              setEditState((s) => s ? { ...s, nameBn: e.target.value } : null)
                            }
                            autoFocus
                          />
                          <Input
                            className="h-7 text-sm hidden sm:block"
                            placeholder="English"
                            value={editState?.nameEn ?? ""}
                            onChange={(e) =>
                              setEditState((s) => s ? { ...s, nameEn: e.target.value } : null)
                            }
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-emerald-600 hover:text-emerald-600 hover:bg-emerald-500/10 shrink-0"
                          onClick={handleEditSave}
                          disabled={updateMutation.isPending}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 shrink-0"
                          onClick={() => setEditState(null)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      /* ── Display mode ── */
                      <>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{cat.nameBn}</p>
                          {cat.nameEn && (
                            <p className="text-xs text-muted-foreground truncate">{cat.nameEn}</p>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {cat.productCount} পণ্য
                        </Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 shrink-0"
                          onClick={() =>
                            setEditState({
                              id: cat.id,
                              nameBn: cat.nameBn,
                              nameEn: cat.nameEn ?? "",
                            })
                          }
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteId(cat.id)}
                          disabled={cat.productCount > 0}
                          title={cat.productCount > 0 ? "পণ্য আছে, মুছতে পারবেন না" : "মুছুন"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Delete confirmation ── */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>বিভাগ মুছবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              এই বিভাগটি স্থায়ীভাবে মুছে যাবে। এই কাজ পূর্বাবস্থায় ফেরানো যাবে না।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDelete}
            >
              মুছে ফেলুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
