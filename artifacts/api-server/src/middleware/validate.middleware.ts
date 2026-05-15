import { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodType } from "zod";
import { ValidationError } from "../common/errors";

type ValidateTarget = "body" | "query" | "params";

export function validate<T>(
  schema: ZodType<T>,
  target: ValidateTarget = "body",
): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const first = result.error.errors[0];
      const msg = first ? `${first.path.join(".")}: ${first.message}` : result.error.message;
      next(new ValidationError(msg));
      return;
    }
    (req as any)[`parsed${target.charAt(0).toUpperCase() + target.slice(1)}`] = result.data;
    next();
  };
}
