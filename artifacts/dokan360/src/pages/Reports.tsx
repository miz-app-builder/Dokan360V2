import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, DollarSign, Package, AlertCircle, Users, BarChart3 } from "lucide-react";
import { DailySalesReport } from "@/components/reports/DailySalesReport";
import { ProfitReport }     from "@/components/reports/ProfitReport";
import { ProductReport }    from "@/components/reports/ProductReport";
import { DueReport }        from "@/components/reports/DueReport";
import { StaffReport }      from "@/components/reports/StaffReport";
import { staggerContainer, fadeInUp } from "@/lib/motion";

const TABS = [
  { value: "daily",   label: "দৈনিক বিক্রয়", icon: TrendingUp   },
  { value: "profit",  label: "মুনাফা",         icon: DollarSign  },
  { value: "product", label: "পণ্য রিপোর্ট",  icon: Package     },
  { value: "due",     label: "বাকি রিপোর্ট",  icon: AlertCircle },
  { value: "staff",   label: "কর্মী রিপোর্ট", icon: Users       },
] as const;

export default function Reports() {
  return (
    <motion.div
      initial="hidden" animate="visible" variants={staggerContainer}
      className="space-y-5 max-w-screen-2xl mx-auto"
    >

      {/* Tabs */}
      <motion.div variants={fadeInUp}>
        <Tabs defaultValue="daily">
          <TabsList className="flex-wrap h-auto gap-1 p-1 rounded-xl bg-muted/60">
            {TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value} value={value}
                className="gap-1.5 text-xs sm:text-sm rounded-lg data-[state=active]:shadow-sm"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="daily"   className="mt-5"><DailySalesReport /></TabsContent>
          <TabsContent value="profit"  className="mt-5"><ProfitReport /></TabsContent>
          <TabsContent value="product" className="mt-5"><ProductReport /></TabsContent>
          <TabsContent value="due"     className="mt-5"><DueReport /></TabsContent>
          <TabsContent value="staff"   className="mt-5"><StaffReport /></TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
