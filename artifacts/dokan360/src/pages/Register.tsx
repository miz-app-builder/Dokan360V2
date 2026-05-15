import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/lib/supabase";
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
import { Store, Sun, Moon, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LanguageToggle } from "@/components/ui/language-switcher";
import { scaleIn } from "@/lib/motion";
import { OtpVerificationStep } from "@/components/auth/OtpVerificationStep";

export default function Register() {
  const { t }  = useTranslation();
  const { toast }  = useToast();
  const { theme, setTheme } = useTheme();
  const [isPending, setIsPending] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const registerSchema = z.object({
    shopName: z.string().min(2, { message: t("auth.shopNameRequired") }),
    name:     z.string().min(2, { message: t("auth.nameRequired") }),
    email:    z.string().email({ message: t("auth.emailInvalid") }),
    password: z.string().min(6, { message: t("auth.passwordMin") }),
  });
  type RegisterFormValues = z.infer<typeof registerSchema>;

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { shopName: "", name: "", email: "", password: "" },
  });

  async function onSubmit(data: RegisterFormValues) {
    setIsPending(true);
    try {
      const resp = await fetch("/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        toast({ variant: "destructive", title: t("auth.registerFailed"), description: body.error ?? t("auth.loginFailedDesc") });
        return;
      }
      const { email } = await resp.json();

      /* Send OTP via Supabase — user must verify email before entering app */
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (otpError) {
        toast({ variant: "destructive", title: t("auth.registerFailed"), description: t("auth.otpSendFailed") });
        return;
      }

      toast({ title: t("auth.registerSuccess"), description: t("auth.otpDesc") });
      setPendingEmail(email);
    } catch (err) {
      const message = err instanceof Error ? err.message : t("auth.registerFailedDesc");
      toast({ variant: "destructive", title: t("auth.registerFailed"), description: message });
    } finally {
      setIsPending(false);
    }
  }

  const header = (
    <div className="flex items-center justify-between px-6 pt-5">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
          <Store className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-base">দোকান ৩৬০</span>
      </div>
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
  );

  /* ── OTP step ─────────────────────────────────────────────────── */
  if (pendingEmail) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {header}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <motion.div initial="hidden" animate="visible" variants={scaleIn}>
            <OtpVerificationStep
              email={pendingEmail}
              onBack={() => setPendingEmail(null)}
            />
          </motion.div>
        </div>
      </div>
    );
  }

  /* ── Registration form ────────────────────────────────────────── */
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {header}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={scaleIn}
          className="w-full max-w-[420px]"
        >
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">{t("auth.registerTitle")}</h1>
            <p className="text-sm text-muted-foreground mt-1.5">{t("auth.registerDesc")}</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="shopName" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">{t("auth.shopName")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="যেমন: আল-আমিন স্টোর"
                      className="h-11 rounded-xl border-border/70 bg-muted/30 focus:bg-background transition-colors"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">{t("auth.yourName")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="আপনার পূর্ণ নাম"
                      className="h-11 rounded-xl border-border/70 bg-muted/30 focus:bg-background transition-colors"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
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
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
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
              )} />

              <Button
                type="submit"
                className="w-full h-11 rounded-full font-semibold text-sm gap-2 mt-1
                           bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
                disabled={isPending}
              >
                {isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />{t("auth.registering")}</>
                ) : (
                  <>{t("auth.registerBtn")}<ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {t("auth.hasAccount")}{" "}
            <Link href="/login" className="text-primary hover:text-primary/80 font-semibold transition-colors">
              {t("auth.goToLogin")}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
