import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, CameraOff, ScanLine, Loader2 } from "lucide-react";

/* ─── Props ──────────────────────────────────────────────────── */
interface CameraScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (code: string) => void;
  title?: string;
}

/* ─── States ─────────────────────────────────────────────────── */
type ScannerState = "idle" | "starting" | "scanning" | "error";

/* ─── Component ──────────────────────────────────────────────── */
export function CameraScanner({ open, onOpenChange, onScan, title = "ক্যামেরা স্ক্যানার" }: CameraScannerProps) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [state, setState]     = useState<ScannerState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [lastScan, setLastScan] = useState("");

  const stopScanner = useCallback(() => {
    try { BrowserMultiFormatReader.releaseAllStreams(); } catch { /* noop */ }
    readerRef.current = null;
    setState("idle");
    setLastScan("");
  }, []);

  const startScanner = useCallback(async () => {
    if (!videoRef.current) return;
    setState("starting");
    setErrorMsg("");
    try {
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;
      await reader.decodeFromConstraints(
        { video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } },
        videoRef.current,
        (result, err) => {
          if (result) {
            const code = result.getText();
            setLastScan(code);
            stopScanner();
            onScan(code);
            onOpenChange(false);
          }
          if (err) {
            /* NotFoundException fires constantly when no barcode is in frame — safe to ignore */
            if (err.name !== "NotFoundException") {
              console.warn("[CameraScanner]", err.message);
            }
          }
        },
      );
      setState("scanning");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMsg(
        msg.toLowerCase().includes("permission")
          ? "ক্যামেরার অনুমতি দিন এবং আবার চেষ্টা করুন"
          : "ক্যামেরা চালু করতে ব্যর্থ হয়েছে",
      );
      setState("error");
      readerRef.current = null;
    }
  }, [onScan, onOpenChange, stopScanner]);

  /* Auto-start when dialog opens */
  useEffect(() => {
    if (open) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => { stopScanner(); };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) stopScanner(); onOpenChange(o); }}>
      <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            <ScanLine className="h-4 w-4 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        {/* Camera viewfinder */}
        <div className="relative mx-4 mb-4 rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
          />

          {/* Scan line overlay */}
          {state === "scanning" && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Corner marks */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br" />
              {/* Animated scan line */}
              <div className="absolute left-6 right-6 h-0.5 bg-primary/80 shadow-[0_0_6px_2px_hsl(var(--primary)/0.5)] animate-scan-line" />
            </div>
          )}

          {/* Starting */}
          {state === "starting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">ক্যামেরা চালু হচ্ছে...</p>
            </div>
          )}

          {/* Error */}
          {state === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white gap-3 px-6 text-center">
              <CameraOff className="h-10 w-10 text-destructive" />
              <p className="text-sm">{errorMsg || "ক্যামেরা সমস্যা হয়েছে"}</p>
              <Button size="sm" variant="outline" onClick={startScanner} className="mt-1 rounded-xl border-white/30 text-white hover:bg-white/20">
                আবার চেষ্টা করুন
              </Button>
            </div>
          )}

          {/* Idle */}
          {state === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white gap-3">
              <Camera className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-5 pb-5 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {state === "scanning"
              ? "পণ্যের বারকোডটি ক্যামেরার সামনে ধরুন"
              : "ক্যামেরার দিকে বারকোড সহ পণ্য ধরুন"}
          </p>
          {state === "scanning" && (
            <Badge variant="secondary" className="gap-1.5 text-xs shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              স্ক্যানিং
            </Badge>
          )}
        </div>

        {lastScan && (
          <div className="px-5 pb-4">
            <p className="text-xs text-muted-foreground">শেষ স্ক্যান: <span className="font-mono font-semibold">{lastScan}</span></p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
