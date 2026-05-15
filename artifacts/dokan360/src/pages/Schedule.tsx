import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { usePageSubtitle } from "@/contexts/PageSubtitleContext";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Grid3X3, Clock } from "lucide-react";
import { ShiftsTab } from "@/components/schedule/ShiftsTab";
import { WeeklyScheduleTab } from "@/components/schedule/WeeklyScheduleTab";
import { CalendarTab } from "@/components/schedule/CalendarTab";

export default function Schedule() {
  const { t } = useTranslation();
  const { setSubtitle } = usePageSubtitle();

  useEffect(() => {
    setSubtitle(t("schedule.subtitle"));
    return () => setSubtitle(null);
  }, [t, setSubtitle]);

  const [activeTab, setActiveTab] = useState<"shifts" | "weekly" | "calendar">("weekly");

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <motion.div variants={fadeInUp} className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{t("schedule.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("schedule.subtitle")}</p>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="weekly" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Grid3X3 className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{t("schedule.tab_weekly")}</span>
              <span className="sm:hidden">{t("schedule.weekly_short")}</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <CalendarDays className="h-4 w-4 shrink-0" />
              <span>{t("schedule.tab_calendar")}</span>
            </TabsTrigger>
            <TabsTrigger value="shifts" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Clock className="h-4 w-4 shrink-0" />
              <span>{t("schedule.tab_shifts")}</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="weekly" className="m-0">
              <WeeklyScheduleTab />
            </TabsContent>
            <TabsContent value="calendar" className="m-0">
              <CalendarTab />
            </TabsContent>
            <TabsContent value="shifts" className="m-0">
              <ShiftsTab />
            </TabsContent>
          </div>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
