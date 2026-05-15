import type { Response } from "express";

export interface ApiSuccess<T = unknown> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

export function ok<T>(res: Response, data: T, status = 200): Response {
  return res.status(status).json(data);
}

export function created<T>(res: Response, data: T): Response {
  return res.status(201).json(data);
}

export function noContent(res: Response): Response {
  return res.status(204).send();
}

export function badRequest(res: Response, message: string): Response {
  return res.status(400).json({ error: message });
}

export function unauthorized(res: Response, message = "অননুমোদিত অ্যাক্সেস"): Response {
  return res.status(401).json({ error: message });
}

export function forbidden(res: Response, message = "এই কাজের অনুমতি নেই"): Response {
  return res.status(403).json({ error: message });
}

export function notFound(res: Response, message = "পাওয়া যায়নি"): Response {
  return res.status(404).json({ error: message });
}
