import { rateLimit } from "express-rate-limit";
import { isProduction } from "../config/env";

const skip = () => !isProduction;

export const authRateLimit = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             10,
  standardHeaders: "draft-7",
  legacyHeaders:   false,
  skip,
  message:         { error: "অনেকবার চেষ্টা করা হয়েছে। ১৫ মিনিট পরে আবার চেষ্টা করুন।" },
});

export const registerRateLimit = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             5,
  standardHeaders: "draft-7",
  legacyHeaders:   false,
  skip,
  message:         { error: "নিবন্ধনের সীমা পূর্ণ হয়েছে। ১ ঘণ্টা পরে আবার চেষ্টা করুন।" },
});

export const refreshRateLimit = rateLimit({
  windowMs:        60 * 1000,
  max:             20,
  standardHeaders: "draft-7",
  legacyHeaders:   false,
  skip,
  message:         { error: "অনেকবার চেষ্টা করা হয়েছে। একটু পরে আবার চেষ্টা করুন।" },
});

export const apiRateLimit = rateLimit({
  windowMs:        60 * 1000,
  max:             200,
  standardHeaders: "draft-7",
  legacyHeaders:   false,
  skip,
  // Suppress the IPv6 fallback validation — trust proxy is set correctly in app.ts
  validate:        { keyGeneratorIpFallback: false },
  message:         { error: "অনেকবার অনুরোধ করা হয়েছে। একটু পরে আবার চেষ্টা করুন।" },
  // Authenticated users get their own quota bucket; anonymous falls back to IP
  keyGenerator:    (req) =>
    req.authUser ? `user:${req.authUser.id}` : (req.ip ?? "unknown"),
});
