import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/errorHandler.js";
import sanitizeHtml from "sanitize-html";
import { ZodError } from "zod";

export const validate = (schema: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        // files: req.files,
        // file: req.file,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = (error as any).issues.map((err: any) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        next(new ApiError(422, "Validation Error", errors));
      } else {
        next(error);
      }
    }
  };
};
import validator from "validator";

export const sanitizeBodyMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      let value = req.body[key];

      if (typeof value === "string") {
        value = sanitizeHtml(value.trim(), {
          allowedTags: [],
          allowedAttributes: {},
          disallowedTagsMode: "discard",
        });
        if (value.includes(":")) {
          const _isUrl = validator.isURL(value, { require_protocol: true });
          const isSafeProtocol = /^(https?|mailto|tel):/i.test(value);

          if (!isSafeProtocol) {
            console.warn(
              `Blocked suspicious protocol in field ${key}: ${value}`,
            );
            value = "";
          }
        }

        req.body[key] = value;
      }
    });
  }
  next();
};
