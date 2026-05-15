import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/contexts/ThemeContext";
import { OtpVerificationStep } from "@/components/auth/OtpVerificationStep";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Store,
  Sun,
  Moon,
  ShieldCheck,
  TrendingUp,
  Users,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LanguageToggle } from "@/components/ui/language-switcher";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";

/* ── Feature bullets shown on the left brand panel ── */
const FEATURES = [
  { icon: TrendingUp, labelBn: "রিয়েল-টাইম বিক্রয় ট্র্যাকিং",   labelEn: "Real-time sales tracking" },
  { icon: Store,      labelBn: "সম্পূর্ণ POS সিস্টেম",           labelEn: "Complete POS system" },
  { icon: Users,      labelBn: "গ্রাহক ব্যবস্থাপনা",              labelEn: "Customer management" },
  { icon: ShieldCheck,labelBn: "সুরক্ষিত ও নির্ভরযোগ্য",         labelEn: "Secure & reliable" },
];

export default function Login() {
  const { t } = useTranslation();
  const { toast }  = useToast();
  const { theme, setTheme } = useTheme();
  const [isPending, setIsPending]       = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const loginSchema = z.object({
    email:    z.string().email({ message: t("auth.emailInvalid") }),
    password: z.string().min(1,  { message: t("auth.passwordRequired") }),
  });
  type LoginFormValues = z.infer<typeof loginSchema>;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsPending(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email:    data.email,
        password: data.password,
      });
      if (error) {
        /* Email not confirmed → send OTP and go to verification step */
        if (error.message.toLowerCase().includes("email not confirmed")) {
          const { error: otpError } = await supabase.auth.signInWithOtp({
            email: data.email,
            options: { shouldCreateUser: false },
          });
          if (!otpError) {
            setPendingEmail(data.email);
            return;
          }
        }
        toast({ variant: "destructive", title: t("auth.loginFailed"), description: t("auth.loginFailedDesc") });
      }
    } finally {
      setIsPending(false);
    }
  }

  /* ── OTP verification step (unconfirmed email) ───────────────── */
  if (pendingEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <OtpVerificationStep
          email={pendingEmail}
          onBack={() => setPendingEmail(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">

      {/* ── Left brand panel (desktop only) ─────────────────── */}
      <motion.aside
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="hidden lg:flex lg:w-[46%] xl:w-[42%] flex-col relative overflow-hidden
                   bg-[hsl(258,60%,18%)] text-white"
      >
        {/* Background gradient layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(258,78%,28%)] via-[hsl(258,60%,18%)] to-[hsl(240,60%,12%)]" />
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-primary/20 blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-violet-500/15 blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10 flex flex-col h-full px-10 py-12">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="h-10 w-10 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-sm flex items-center justify-center">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">দোকান ৩৬০</span>
          </div>

          {/* Main headline */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-6 my-12"
          >
            <motion.h2 variants={fadeInUp} className="text-4xl font-bold leading-tight">
              আপনার ব্যবসাকে<br />
              <span className="text-violet-300">ডিজিটাল করুন</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-white/65 text-base leading-relaxed max-w-sm">
              বাংলাদেশের হাজারো দোকানদার Dokan360 ব্যবহার করে তাদের ব্যবসা পরিচালনা করছেন।
            </motion.p>

            <motion.div variants={staggerContainer} className="space-y-3 pt-2">
              {FEATURES.map(({ icon: Icon, labelBn }) => (
                <motion.div
                  key={labelBn}
                  variants={fadeInUp}
                  className="flex items-center gap-3"
                >
                  <div className="h-7 w-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                    <Icon className="h-3.5 w-3.5 text-violet-300" />
                  </div>
                  <span className="text-sm text-white/80">{labelBn}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Bottom tagline */}
          <p className="text-white/35 text-xs">© 2026 Dokan360 · Made in Bangladesh 🇧🇩</p>
        </div>
      </motion.aside>

      {/* ── Right form panel ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col">
        {/* Top controls */}
        <div className="flex items-center justify-between px-6 pt-5">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
              <Store className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-base">দোকান ৩৬০</span>
          </div>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={scaleIn}
            className="w-full max-w-[400px]"
          >
            {/* Heading */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground">{t("auth.loginTitle")}</h1>
              <p className="text-sm text-muted-foreground mt-1.5">{t("auth.loginDesc")}</p>
            </div>

            {/* Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">{t("auth.email")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="example@gmail.com"
                          className="h-11 rounded-xl border-border/70 bg-muted/30 focus:bg-background transition-colors"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">{t("auth.password")}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="h-11 rounded-xl border-border/70 bg-muted/30 focus:bg-background transition-colors"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-11 rounded-full font-semibold text-sm gap-2 mt-1
                             bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("auth.loggingIn")}
                    </>
                  ) : (
                    <>
                      {t("auth.loginBtn")}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {t("auth.noAccount")}{" "}
              <Link href="/register" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                {t("auth.createAccount")}
              </Link>
            </div>

            {/* Demo box */}
            <div className="mt-6 p-4 rounded-2xl bg-muted/50 border border-border/50">
              <p className="text-xs font-semibold text-foreground mb-1.5">{t("auth.demoAccount")}</p>
              <p className="text-xs text-muted-foreground font-mono">demo@dokan360.com · demo123</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
