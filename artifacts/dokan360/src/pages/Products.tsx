import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/hooks/useLocale";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProducts,
  useListCategories,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  getListProductsQueryKey,
  getListInventoryQueryKey,
} from "@workspace/api-client-react";
import type { Product } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  Package,
  Tag,
  AlertTriangle,
  X,
  Barcode,
  Printer,
  CheckSquare,
  Square,
} from "lucide-react";
import { ProductFormDialog, type ProductFormValues } from "@/components/products/ProductFormDialog";
import { CategoryManager } from "@/components/products/CategoryManager";
import { ProductsTable } from "@/components/products/ProductsTable";
import { BarcodeLabel } from "@/components/barcode/BarcodeLabel";
import { BarcodePrintDialog } from "@/components/barcode/BarcodePrintDialog";
import { fadeInUp, staggerContainer } from "@/lib/motion";

/* ─── Payload builder ────────────────────────────────────────── */
function buildPayload(values: ProductFormValues) {
  return {
    nameBn:        values.nameBn,
    nameEn:        values.nameEn?.trim() || null,
    sku:           values.sku?.trim() || null,
    barcode:       values.barcode?.trim() || null,
    price:         Number(values.price),
    costPrice:     values.costPrice !== "" && values.costPrice != null
                     ? Number(values.costPrice)
                     : null,
    stockQuantity: Number(values.stockQuantity),
    minStockLevel: Number(values.minStockLevel),
    unit:          values.unit,
    categoryId:    values.categoryId && values.categoryId !== "none"
                     ? Number(values.categoryId)
                     : null,
    isActive:      values.isActive,
  };
}

/* ─── Stat pill ──────────────────────────────────────────────── */
function StatPill({ icon: Icon, label, value, accent, iconColor }: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  accent: string;
  iconColor: string;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border/60 shadow-sm">
      <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>
        <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
      </div>
      <div className="leading-none">
        <span className="text-[11px] text-muted-foreground">{label}: </span>
        <span className="text-sm font-bold tabular-nums">{value}</span>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function Products() {
  const { t } = useTranslation();
  const { formatCurrency } = useLocale();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch]               = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [lowStockOnly, setLowStockOnly]    = useState(false);
  const [formOpen, setFormOpen]            = useState(false);
  const [editProduct, setEditProduct]      = useState<Product | null>(null);
  const [deleteId, setDeleteId]            = useState<number | null>(null);
  const [selectedIds, setSelectedIds]      = useState<Set<number>>(new Set());
  const [bulkPrintOpen, setBulkPrintOpen]  = useState(false);

  const { data: products, isLoading } = useListProducts({
    search:     search || undefined,
    categoryId: categoryFilter && categoryFilter !== "all" ? Number(categoryFilter) : undefined,
    lowStock:   lowStockOnly || undefined,
  });
  const { data: categories } = useListCategories();

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
    qc.invalidateQueries({ queryKey: getListInventoryQueryKey() });
  };

  const openCreate = () => { setEditProduct(null); setFormOpen(true); };
  const openEdit   = (p: Product) => { setEditProduct(p); setFormOpen(true); };

  const handleFormSubmit = (values: ProductFormValues, isEdit: boolean) => {
    const payload = buildPayload(values);
    if (isEdit && editProduct) {
      updateMutation.mutate(
        { id: editProduct.id, data: payload },
        {
          onSuccess: () => { toast({ title: t("products.editSuccess") }); setFormOpen(false); invalidate(); },
          onError:   () => toast({ variant: "destructive", title: t("products.editError") }),
        }
      );
    } else {
      createMutation.mutate(
        { data: payload },
        {
          onSuccess: () => { toast({ title: t("products.addSuccess") }); setFormOpen(false); invalidate(); },
          onError:   () => toast({ variant: "destructive", title: t("products.addError") }),
        }
      );
    }
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(
      { id: deleteId },
      {
        onSuccess: () => { toast({ title: t("products.deleteSuccess") }); setDeleteId(null); invalidate(); },
        onError:   () => toast({ variant: "destructive", title: t("products.deleteError") }),
      }
    );
  };

  const totalProducts = (products ?? []).length;
  const lowStockCount = (products ?? []).filter(
    (p: Product) => p.stockQuantity <= p.minStockLevel
  ).length;
  const hasFilters = !!search || (!!categoryFilter && categoryFilter !== "all") || lowStockOnly;
  const clearFilters = () => { setSearch(""); setCategoryFilter(""); setLowStockOnly(false); };

  /* ── Barcode tab helpers ── */
  const allProducts   = products ?? [];
  const toggleSelect  = (id: number) =>
    setSelectedIds((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const selectAll    = () => setSelectedIds(new Set(allProducts.map((p: Product) => p.id)));
  const deselectAll  = () => setSelectedIds(new Set());
  const allSelected  = allProducts.length > 0 && selectedIds.size === allProducts.length;
  const selectedProducts = allProducts.filter((p: Product) => selectedIds.has(p.id));

  return (
    <div className="space-y-5 max-w-screen-2xl mx-auto">

      {/* ── Action bar ── */}
      <motion.div
        initial="hidden" animate="visible" variants={fadeInUp}
        className="flex justify-end"
      >
        <Button
          onClick={openCreate}
          className="gap-2 shrink-0 rounded-xl shadow-md shadow-primary/20"
        >
          <Plus className="h-4 w-4" />
          {t("products.addProduct")}
        </Button>
      </motion.div>

      {/* ── Tabs ── */}
      <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
        <Tabs defaultValue="products">
          <motion.div variants={fadeInUp} className="flex items-center justify-between gap-3 flex-wrap mb-5">
            <TabsList className="h-9 rounded-xl bg-muted/60 p-1">
              <TabsTrigger value="products" className="gap-2 text-sm rounded-lg h-7 data-[state=active]:shadow-sm">
                <Package className="h-3.5 w-3.5" />
                {t("products.list")}
              </TabsTrigger>
              <TabsTrigger value="categories" className="gap-2 text-sm rounded-lg h-7 data-[state=active]:shadow-sm">
                <Tag className="h-3.5 w-3.5" />
                {t("products.categoryManager")}
              </TabsTrigger>
              <TabsTrigger value="barcode" className="gap-2 text-sm rounded-lg h-7 data-[state=active]:shadow-sm">
                <Barcode className="h-3.5 w-3.5" />
                {t("barcode.tab")}
              </TabsTrigger>
            </TabsList>

            {/* Stats */}
            <div className="flex items-center gap-2 flex-wrap">
              <StatPill
                icon={Package} label={t("products.totalProducts")}
                value={isLoading ? "..." : totalProducts}
                accent="bg-primary/10" iconColor="text-primary"
              />
              {lowStockCount > 0 && (
                <StatPill
                  icon={AlertTriangle} label={t("products.lowStockCount")}
                  value={lowStockCount}
                  accent="bg-orange-500/12" iconColor="text-orange-600 dark:text-orange-400"
                />
              )}
            </div>
          </motion.div>

          {/* ── Products tab ── */}
          <TabsContent value="products" className="space-y-4 mt-0">
            {/* Toolbar */}
            <motion.div variants={fadeInUp} className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  className="pl-9 h-9 rounded-xl border-border/70 bg-card"
                  placeholder={t("products.searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <Select value={categoryFilter || "all"} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px] h-9 rounded-xl border-border/70 bg-card">
                  <SelectValue placeholder={t("products.allCategories")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">{t("products.allCategories")}</SelectItem>
                  {(categories ?? []).map((c: { id: number; nameBn: string }) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nameBn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant={lowStockOnly ? "default" : "outline"}
                size="sm"
                className={`h-9 gap-2 rounded-xl ${lowStockOnly ? "shadow-md shadow-primary/15" : "border-border/70 bg-card"}`}
                onClick={() => setLowStockOnly((v) => !v)}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                {t("products.lowStockOnly")}
              </Button>

              {hasFilters && (
                <>
                  <Button
                    variant="ghost" size="sm"
                    className="h-9 gap-1.5 text-muted-foreground hover:text-foreground rounded-xl"
                    onClick={clearFilters}
                  >
                    <X className="h-3.5 w-3.5" />
                    {t("common.reset")}
                  </Button>

                  <div className="flex items-center gap-1.5">
                    {search && (
                      <Badge variant="secondary" className="text-xs gap-1 rounded-lg px-2">
                        "{search}"
                        <button onClick={() => setSearch("")} className="ml-0.5 hover:text-foreground">
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </Badge>
                    )}
                    {categoryFilter && categoryFilter !== "all" && (
                      <Badge variant="secondary" className="text-xs gap-1 rounded-lg px-2">
                        {categories?.find((c: { id: number }) => String(c.id) === categoryFilter)?.nameBn ?? t("common.category")}
                        <button onClick={() => setCategoryFilter("")} className="ml-0.5 hover:text-foreground">
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </Badge>
                    )}
                    {lowStockOnly && (
                      <Badge variant="secondary" className="text-xs gap-1 rounded-lg px-2">
                        {t("products.lowStockOnly")}
                        <button onClick={() => setLowStockOnly(false)} className="ml-0.5 hover:text-foreground">
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </Badge>
                    )}
                  </div>
                </>
              )}
            </motion.div>

            <motion.div variants={fadeInUp}>
              <ProductsTable
                products={products ?? []}
                isLoading={isLoading}
                onEdit={openEdit}
                onDelete={(id) => setDeleteId(id)}
                isDeleting={deleteMutation.isPending}
                deleteId={deleteId}
                onDeleteConfirm={handleDelete}
                onDeleteCancel={() => setDeleteId(null)}
              />
            </motion.div>
          </TabsContent>

          {/* ── Categories tab ── */}
          <TabsContent value="categories" className="mt-0">
            <motion.div variants={fadeInUp}>
              <CategoryManager />
            </motion.div>
          </TabsContent>

          {/* ── Barcode tab ── */}
          <TabsContent value="barcode" className="mt-0">
            <motion.div variants={fadeInUp} className="space-y-4">
              {/* Toolbar */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2 rounded-xl border-border/70"
                  onClick={allSelected ? deselectAll : selectAll}
                >
                  {allSelected
                    ? <><Square className="h-3.5 w-3.5" />{t("barcode.deselectAll")}</>
                    : <><CheckSquare className="h-3.5 w-3.5" />{t("barcode.selectAll")}</>}
                </Button>

                {selectedIds.size > 0 && (
                  <>
                    <Badge variant="secondary" className="text-xs rounded-lg px-2 h-7">
                      {t("barcode.selectedCount", { count: selectedIds.size })}
                    </Badge>
                    <Button
                      size="sm"
                      className="h-9 gap-2 rounded-xl shadow-md shadow-primary/20"
                      onClick={() => setBulkPrintOpen(true)}
                    >
                      <Printer className="h-3.5 w-3.5" />
                      {t("barcode.printSelected")}
                    </Button>
                  </>
                )}
              </div>

              {/* Product list with checkboxes + barcode preview */}
              {isLoading ? (
                <div className="rounded-xl border border-border/60 divide-y divide-border/40 bg-card shadow-sm">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="px-4 py-3">
                      <div className="h-10 w-full rounded-lg bg-muted animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-border/60 overflow-hidden bg-card shadow-sm divide-y divide-border/40">
                  {allProducts.length === 0 && (
                    <div className="flex flex-col items-center py-16 text-muted-foreground gap-3">
                      <Package className="h-7 w-7 opacity-30" />
                      <p className="text-sm">{t("products.noProductsFound")}</p>
                    </div>
                  )}
                  {allProducts.map((p: Product) => {
                    const checked = selectedIds.has(p.id);
                    const code = p.barcode || p.sku || "";
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center gap-4 px-4 py-3 transition-colors cursor-pointer hover:bg-muted/20 ${
                          checked ? "bg-primary/5" : ""
                        }`}
                        onClick={() => toggleSelect(p.id)}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleSelect(p.id)}
                          className="shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{p.nameBn}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs font-bold text-primary tabular-nums">
                              {formatCurrency(p.price)}
                            </span>
                            {code ? (
                              <span className="text-xs text-muted-foreground font-mono">{code}</span>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 gap-1">
                                <Barcode className="h-2.5 w-2.5" />
                                {t("barcode.noBarcode")}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {/* Barcode mini-preview (desktop only) */}
                        <div className="hidden xl:block shrink-0 opacity-80 pointer-events-none">
                          <BarcodeLabel product={p} size="sm" showPrice={false} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Bulk barcode print dialog */}
      <BarcodePrintDialog
        open={bulkPrintOpen}
        onOpenChange={setBulkPrintOpen}
        products={selectedProducts}
      />

      {/* Form Dialog */}
      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editProduct={editProduct}
        categories={categories ?? []}
        onSubmit={handleFormSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
