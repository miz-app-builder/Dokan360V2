import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { usePageSubtitle } from "@/contexts/PageSubtitleContext";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, LayoutList, BarChart2 } from "lucide-react";
import { LeaveTypesTab } from "@/components/leaves/LeaveTypesTab";
import { LeaveRequestsTab } from "@/components/leaves/LeaveRequestsTab";
import { LeaveBalancesTab } from "@/components/leaves/LeaveBalancesTab";

export default function Leaves() {
  const { t } = useTranslation();
  const { setSubtitle } = usePageSubtitle();

  useEffect(() => {
    setSubtitle(t("leaves.subtitle"));
    return () => setSubtitle(null);
  }, [t, setSubtitle]);

  const [activeTab, setActiveTab] = useState<"requests" | "balances" | "types">("requests");

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <motion.div variants={fadeInUp} className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{t("leaves.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("leaves.subtitle")}</p>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="requests" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <FileText className="h-4 w-4 shrink-0" />
              {t("leaves.tab_requests")}
            </TabsTrigger>
            <TabsTrigger value="balances" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <BarChart2 className="h-4 w-4 shrink-0" />
              {t("leaves.tab_balances")}
            </TabsTrigger>
            <TabsTrigger value="types" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <LayoutList className="h-4 w-4 shrink-0" />
              {t("leaves.tab_types")}
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="requests" className="m-0">
              <LeaveRequestsTab />
            </TabsContent>
            <TabsContent value="balances" className="m-0">
              <LeaveBalancesTab />
            </TabsContent>
            <TabsContent value="types" className="m-0">
              <LeaveTypesTab />
            </TabsContent>
          </div>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
