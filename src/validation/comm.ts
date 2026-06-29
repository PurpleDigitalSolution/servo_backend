import { z } from "zod";
import { registry } from "../docs/registry.js";
const errorDataSchema = z.object({
  field: z.string(),
  message: z.string(),
});
export const errorSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  error: errorDataSchema,
});

registry.register("ErrorResponse", errorSchema);
