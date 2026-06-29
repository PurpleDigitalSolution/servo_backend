import { z } from "zod";
import { registry } from "../docs/registry.js";

export const createUserBodySchema = z.object({
  email: z.email({ message: "Invalid email address" }).openapi({
    type: "string",
    format: "email",
    description: "User's role, either 'admin' or 'user'",
  }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .openapi({
      type: "string",
      format: "password",
      description: "User's password, must be at least 8 characters long",
    }),
  role: z
    .enum(["admin", "user"], {
      message: "Role must be either 'admin' or 'user'",
    })
    .openapi({
      type: "string",
      description: "User's role, either 'admin' or 'user'",
    }),
  firstName: z.string().min(1, { message: "First name is required" }).openapi({
    type: "string",
    description: "User's first name",
  }),
  lastName: z.string().min(1, { message: "Last name is required" }).openapi({
    type: "string",
    description: "User's last name",
  }),
  phoneNumber: z
    .string()
    .min(1, { message: "Phone number is required" })
    .openapi({
      type: "string",
      description: "User's phone number",
    }),
  dateOfBirth: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date of birth",
    })
    .openapi({
      type: "string",
      format: "date",
      description: "Date of birth in YYYY-MM-DD format",
    }),
  address: z.string().min(1, { message: "Address is required" }).openapi({
    type: "string",
    description: "User's address",
  }),
});

export const loginBodySchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).openapi({
    type: "string",
    format: "email",
    description: "User's email address",
  }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .openapi({
      type: "string",
      format: "password",
      description: "User's password, must be at least 8 characters long",
    }),
});

export const loginRequestSchema = z.object({
  body: loginBodySchema,
});
export const createUserSchema = z.object({
  body: createUserBodySchema,
});

export const registrationResponseSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "user"]),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phoneNumber: z.string().min(1),
  dateOfBirth: z.string().refine((date) => !isNaN(Date.parse(date))),
  address: z.string().min(1),
});

registry.register("CreateUserRequest", createUserBodySchema);
registry.register("RegistrationResponse", registrationResponseSchema);

registry.register("LoginRequest", loginBodySchema);
