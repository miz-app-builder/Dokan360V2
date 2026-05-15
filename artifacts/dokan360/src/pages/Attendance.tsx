import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { usePageSubtitle } from "@/contexts/PageSubtitleContext";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarCheck, Clock, BarChart3 } from "lucide-react";
import { TodayAttendanceTab } from "@/components/attendance/TodayAttendanceTab";
import { HistoryTab } from "@/components/attendance/HistoryTab";
import { ReportTab } from "@/components/attendance/ReportTab";

export default function Attendance() {
  const { t } = useTranslation();
  const { setSubtitle } = usePageSubtitle();

  useEffect(() => {
    setSubtitle(t("attendance.subtitle"));
    return () => setSubtitle(null);
  }, [t, setSubtitle]);

  const [activeTab, setActiveTab] = useState<"today" | "history" | "report">("today");

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <motion.div variants={fadeInUp} className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{t("attendance.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("attendance.subtitle")}</p>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="today" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <CalendarCheck className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{t("attendance.tab_today")}</span>
              <span className="sm:hidden">{t("attendance.today")}</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Clock className="h-4 w-4 shrink-0" />
              <span>{t("attendance.tab_history")}</span>
            </TabsTrigger>
            <TabsTrigger value="report" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <BarChart3 className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{t("attendance.tab_report")}</span>
              <span className="sm:hidden">{t("attendance.report")}</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="today" className="m-0">
              <TodayAttendanceTab />
            </TabsContent>
            <TabsContent value="history" className="m-0">
              <HistoryTab />
            </TabsContent>
            <TabsContent value="report" className="m-0">
              <ReportTab />
            </TabsContent>
          </div>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
