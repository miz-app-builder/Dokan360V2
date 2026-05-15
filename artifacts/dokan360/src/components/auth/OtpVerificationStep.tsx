import { useRef, useState, useEffect, ClipboardEvent, KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, ArrowLeft, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface Props {
  email: string;
  onBack: () => void;
}

const OTP_LENGTH = 8;
const RESEND_SECONDS = 60;

export function OtpVerificationStep({ email, onBack }: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [digits, setDigits]           = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isPending, setIsPending]     = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown]       = useState(RESEND_SECONDS);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* ── countdown timer ──────────────────────────────────────────── */
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  /* ── input handlers ───────────────────────────────────────────── */
  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!text) return;
    const next = Array(OTP_LENGTH).fill("");
    text.split("").forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    inputRefs.current[Math.min(text.length, OTP_LENGTH - 1)]?.focus();
  }

  /* ── verify ───────────────────────────────────────────────────── */
  async function handleVerify() {
    const token = digits.join("");
    if (token.length !== OTP_LENGTH) return;
    setIsPending(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
      if (error) throw error;
      /* AuthContext onAuthStateChange → SIGNED_IN → /api/auth/me → redirect to / */
    } catch {
      toast({
        variant: "destructive",
        title:       t("auth.otpInvalid"),
        description: t("auth.otpInvalidDesc"),
      });
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setIsPending(false);
    }
  }

  /* ── resend ───────────────────────────────────────────────────── */
  async function handleResend() {
    setIsResending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      setCooldown(RESEND_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      toast({ title: t("auth.otpSentAgain") });
    } catch {
      toast({ variant: "destructive", title: t("auth.otpSendFailed") });
    } finally {
      setIsResending(false);
    }
  }

  const isFilled = digits.every((d) => d !== "");

  return (
    <div className="w-full max-w-[420px]">
      {/* icon */}
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
        <ShieldCheck className="h-7 w-7 text-primary" />
      </div>

      <h1 className="text-2xl font-bold text-foreground">{t("auth.otpTitle")}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{t("auth.otpDesc")}</p>
      <p className="mt-1 text-sm font-medium text-primary">{email}</p>

      {/* 6-digit boxes */}
      <div className="mt-8 flex gap-2.5 justify-center">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            autoFocus={i === 0}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className="h-14 w-12 rounded-xl border border-border/70 bg-muted/30 text-center text-xl font-bold
                       text-foreground outline-none transition-all
                       focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20
                       disabled:opacity-50"
            disabled={isPending}
          />
        ))}
      </div>

      {/* verify button */}
      <Button
        className="mt-6 w-full h-11 rounded-full font-semibold text-sm gap-2
                   bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all"
        disabled={!isFilled || isPending}
        onClick={handleVerify}
      >
        {isPending
          ? <><Loader2 className="h-4 w-4 animate-spin" />{t("auth.otpVerifying")}</>
          : t("auth.otpVerifyBtn")}
      </Button>

      {/* resend */}
      <div className="mt-4 flex items-center justify-center gap-1 text-sm text-muted-foreground">
        {cooldown > 0 ? (
          <span>{t("auth.otpResendIn", { seconds: cooldown })}</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="flex items-center gap-1.5 font-semibold text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t("auth.otpResend")}
          </button>
        )}
      </div>

      {/* back */}
      <button
        type="button"
        onClick={onBack}
        className="mt-5 flex w-full items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("auth.otpBack")}
      </button>
    </div>
  );
}
