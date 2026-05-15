import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListInventory,
  useAdjustInventory,
  getListInventoryQueryKey,
  getListProductsQueryKey,
  getListInventoryAdjustmentsQueryKey,
} from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Boxes } from "lucide-react";

import { LowStockBanner }     from "@/components/inventory/LowStockBanner";
import { StockAdjustDialog }  from "@/components/inventory/StockAdjustDialog";
import { InventoryTable }     from "@/components/inventory/InventoryTable";
import { StockHistoryDrawer } from "@/components/inventory/StockHistoryDrawer";
import type { AdjustTarget }  from "@/components/inventory/StockAdjustDialog";
import { staggerContainer, fadeInUp } from "@/lib/motion";

export default function Inventory() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc        = useQueryClient();

  const [adjustItem,  setAdjustItem]  = useState<AdjustTarget | null>(null);
  const [historyItem, setHistoryItem] = useState<AdjustTarget | null>(null);

  const { data: inventory, isLoading } = useListInventory();
  const adjustMutation                  = useAdjustInventory();

  const items    = inventory ?? [];
  const lowItems = items.filter((i: { isLowStock: boolean }) => i.isLowStock);

  const openAdjust  = useCallback((item: AdjustTarget) => setAdjustItem(item),  []);
  const openHistory = useCallback((item: AdjustTarget) => setHistoryItem(item), []);

  const handleAdjustSubmit = (data: {
    productId: number;
    type:      "in" | "out" | "adjustment";
    quantity:  number;
    reason?:   string;
  }) => {
    adjustMutation.mutate(
      { data },
      {
        onSuccess: () => {
          toast({ title: t("inventory.adjustSuccess") });
          setAdjustItem(null);
          qc.invalidateQueries({ queryKey: getListInventoryQueryKey() });
          qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
          qc.invalidateQueries({ queryKey: getListInventoryAdjustmentsQueryKey() });
        },
        onError: () => toast({ variant: "destructive", title: t("inventory.adjustError") }),
      }
    );
  };

  return (
    <motion.div
      initial="hidden" animate="visible" variants={staggerContainer}
      className="space-y-5 max-w-screen-2xl mx-auto"
    >

      {/* Low stock banner */}
      <motion.div variants={fadeInUp}>
        <LowStockBanner
          items={lowItems.map((i: {
            id: number; nameBn: string; stockQuantity: number; minStockLevel: number; unit: string;
          }) => i)}
          onAdjustItem={openAdjust}
        />
      </motion.div>

      {/* Inventory table */}
      <motion.div variants={fadeInUp}>
        <InventoryTable
          items={items}
          isLoading={isLoading}
          onAdjust={openAdjust}
          onShowHistory={openHistory}
        />
      </motion.div>

      {/* Dialogs */}
      <StockAdjustDialog
        open={!!adjustItem}
        item={adjustItem}
        isPending={adjustMutation.isPending}
        onClose={() => setAdjustItem(null)}
        onSubmit={handleAdjustSubmit}
      />
      <StockHistoryDrawer
        open={!!historyItem}
        item={historyItem}
        onClose={() => setHistoryItem(null)}
      />
    </motion.div>
  );
}
