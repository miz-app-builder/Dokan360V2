import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Wand2 } from "lucide-react";
import type { Product, Category } from "@workspace/api-client-react";

/* ─── Barcode auto-generator ─────────────────────────────────── */
function autoGenBarcode(productId?: number | null): string {
  if (productId) return `DKN${String(productId).padStart(7, "0")}`;
  return `DKN${Date.now().toString().slice(-8)}`;
}

/* ─── Constants ─────────────────────────────────────────────── */
export const UNITS = [
  "পিস", "কেজি", "গ্রাম", "লিটার", "মিলি",
  "বাক্স", "ডজন", "প্যাকেট", "ব্যাগ", "মিটার",
];

/* ─── Zod Schema ─────────────────────────────────────────────── */
const productSchema = z.object({
  nameBn:       z.string().min(1, "পণ্যের নাম আবশ্যক"),
  nameEn:       z.string().optional(),
  sku:          z.string().optional(),
  barcode:      z.string().optional(),
  price:        z.coerce.number({ invalid_type_error: "সংখ্যা দিন" }).min(0, "দাম ০ বা বেশি হতে হবে"),
  costPrice:    z.coerce.number().min(0).optional().or(z.literal("")),
  stockQuantity: z.coerce.number().int().min(0, "মজুদ ০ বা বেশি হতে হবে"),
  minStockLevel: z.coerce.number().int().min(0),
  unit:         z.string().min(1, "একক আবশ্যক"),
  categoryId:   z.string().optional(),
  isActive:     z.boolean(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

/* ─── Default empty form ─────────────────────────────────────── */
export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  nameBn: "", nameEn: "", sku: "", barcode: "",
  price: 0, costPrice: "", stockQuantity: 0, minStockLevel: 5,
  unit: "পিস", categoryId: "", isActive: true,
};

/* ─── Helper: product → form values ─────────────────────────── */
export function productToForm(p: Product): ProductFormValues {
  return {
    nameBn:        p.nameBn,
    nameEn:        p.nameEn ?? "",
    sku:           p.sku ?? "",
    barcode:       p.barcode ?? "",
    price:         Number(p.price),
    costPrice:     p.costPrice != null ? Number(p.costPrice) : "",
    stockQuantity: p.stockQuantity,
    minStockLevel: p.minStockLevel,
    unit:          p.unit,
    categoryId:    p.categoryId ? String(p.categoryId) : "",
    isActive:      p.isActive,
  };
}

/* ─── Props ──────────────────────────────────────────────────── */
interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editProduct?: Product | null;
  categories: Category[];
  onSubmit: (values: ProductFormValues, isEdit: boolean) => void;
  isPending: boolean;
}

/* ─── Component ──────────────────────────────────────────────── */
export function ProductFormDialog({
  open,
  onOpenChange,
  editProduct,
  categories,
  onSubmit,
  isPending,
}: ProductFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = !!editProduct;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: EMPTY_PRODUCT_FORM,
  });

  useEffect(() => {
    if (open) {
      form.reset(isEdit ? productToForm(editProduct!) : EMPTY_PRODUCT_FORM);
    }
  }, [open, editProduct]);

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(values, isEdit);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {isEdit ? t("products.editProduct") : t("products.addProduct")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* ── Section: Basic Info ── */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {t("products.basicInfo")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField control={form.control} name="nameBn" render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{t("products.nameBn")} <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="যেমন: মিনিকেট চাল" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="nameEn" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("products.nameEn")}</FormLabel>
                    <FormControl>
                      <Input placeholder="Miniket Rice" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="categoryId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("products.category")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("common.selectOption")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">{t("products.noCategory")}</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.nameBn}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            <Separator />

            {/* ── Section: Identifiers ── */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {t("products.identifiers")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField control={form.control} name="sku" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("products.sku")}</FormLabel>
                    <FormControl>
                      <Input placeholder="যেমন: RICE-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="barcode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("products.barcode")}</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder="যেমন: 8901234567890" {...field} />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 h-9 gap-1.5 rounded-xl text-xs border-dashed"
                        onClick={() => field.onChange(autoGenBarcode(editProduct?.id))}
                      >
                        <Wand2 className="h-3.5 w-3.5" />
                        {t("barcode.autoGenerate")}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            <Separator />

            {/* ── Section: Pricing ── */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {t("products.pricing")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("products.price")} <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="costPrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("products.costPrice")}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            <Separator />

            {/* ── Section: Stock ── */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {t("products.stockManagement")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormField control={form.control} name="stockQuantity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEdit ? t("products.currentStockLabel") : t("products.initialStockLabel")}</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="1" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="minStockLevel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("products.minStockWarning")}</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="1" placeholder="5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="unit" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("products.measureUnit")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNITS.map((u) => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* ── Active toggle (edit only) ── */}
            {isEdit && (
              <>
                <Separator />
                <FormField control={form.control} name="isActive" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                    <div>
                      <FormLabel className="text-sm font-medium">{t("products.isActive")}</FormLabel>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("products.isActiveDesc")}
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )} />
              </>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? (isEdit ? t("products.updating") : t("products.adding"))
                  : (isEdit ? t("products.update") : t("products.addNew"))}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
