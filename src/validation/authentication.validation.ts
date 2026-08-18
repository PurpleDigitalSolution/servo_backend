import { z } from "zod";
import { registry } from "../docs/registry.js";

// ==========================================
// 1. REUSABLE ATOMIC SCHEMAS (DRY Principle)
// ==========================================
const EmailSchema = z
  .string()
  .email({ message: "Invalid email address" })
  .openapi({
    type: "string",
    format: "email",
    description: "User's unique email address",
    example: "developer@example.com",
  });

const PasswordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters long" })
  .openapi({
    type: "string",
    format: "password",
    description: "User's account password (minimum 8 characters)",
  });

const RoleSchema = z
  .enum(["ADMIN", "CUSTOMER", "AGENT"], {
    message: "Role must be either 'ADMIN', 'CUSTOMER', or 'AGENT'",
  })
  .openapi({
    type: "string",
    description: "User access control role",
    example: "CUSTOMER",
  });

const DateOfBirthSchema = z
  .string()
  .refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date of birth",
  })
  .openapi({
    type: "string",
    format: "date",
    description: "Date of birth in YYYY-MM-DD format",
    example: "1995-12-04",
  });

// ==========================================
// 2. REQUEST BODY SCHEMAS
// ==========================================
export const createUserBodySchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  role: RoleSchema,
  firstName: z
    .string()
    .min(1, { message: "First name is required" })
    .openapi({ description: "User's given first name" }),
  lastName: z
    .string()
    .min(1, { message: "Last name is required" })
    .openapi({ description: "User's family name" }),
  phoneNumber: z
    .string()
    .min(1, { message: "Phone number is required" })
    .openapi({ description: "Contact phone number" }),
  dateOfBirth: DateOfBirthSchema,
  address: z
    .string()
    .min(1, { message: "Address is required" })
    .openapi({ description: "Physical residential address" }),
});
export const createAgentBodySchema = z.object({
  email: EmailSchema,
  role: RoleSchema,
  firstName: z
    .string()
    .min(1, { message: "First name is required" })
    .openapi({ description: "User's given first name" }),
  lastName: z
    .string()
    .min(1, { message: "Last name is required" })
    .openapi({ description: "User's family name" }),
  phoneNumber: z
    .string()
    .min(1, { message: "Phone number is required" })
    .openapi({ description: "Contact phone number" }),
  dateOfBirth: DateOfBirthSchema,
  address: z
    .string()
    .min(1, { message: "Address is required" })
    .openapi({ description: "Physical residential address" }),
});

export const loginBodySchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});

export const verifyOtpBodySchema = z.object({
  email: EmailSchema,
  otp: z.string().min(1, { message: "OTP is required" }),
  purpose: z.enum(["FORGET_PASSWORD", "EMAIL_VERIFICATION"], {
    message: "Purpose must be either 'FORGET_PASSWORD' or 'EMAIL_VERIFICATION'",
  }),
});
export const updateAccountStatusBodySchema = z
  .object({
    userId: z.string().uuid({ message: "Invalid user ID format" }),
    status: z.enum(["SUSPENDED", "BANNED", "ACTIVE"], {
      message: "Status must be either 'SUSPENDED', 'BANNED', or 'ACTIVE'",
    }),
    data: z
      .object({
        reason: z
          .string()
          .trim()
          .min(3, { message: "Reason must be at least 3 characters" }),
      })
      .optional(),
  })
  .superRefine((val, ctx) => {
    if (
      (val.status === "SUSPENDED" || val.status === "BANNED") &&
      !val.data?.reason
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A reason is required when suspending or banning an account",
        path: ["data", "reason"],
      });
    }
  });

export const AccountStatusUpdateRequestSchema = z.object({
  body: updateAccountStatusBodySchema,
});
export const createUserSchema = z.object({ body: createUserBodySchema });
export const createAgentSchema = z.object({ body: createAgentBodySchema });
export const loginRequestSchema = z.object({ body: loginBodySchema });
export const requestOtpSchema = z.object({
  body: z.object({ email: EmailSchema }),
});
export const verifyOtpSchema = z.object({
  body: verifyOtpBodySchema,
});
export const resetPasswordSchema = z.object({
  body: z.object({
    newPassword: PasswordSchema,
    token: z.string().min(1, { message: "token is required" }),
  }),
});
export const sendTestEmailSchema = z.object({
  body: z.object({
    email: EmailSchema,
    subject: z.string().min(1).optional(),
    message: z.string().min(1).optional(),
  }),
});
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: PasswordSchema,
    newPassword: PasswordSchema,
  }),
});
export const changeDefaultPasswordSchema = z.object({
  body: z.object({
    newPassword: PasswordSchema,
  }),
});
// ==========================================
// 3. RESPONSE SCHEMAS
// ==========================================
export const registrationResponseSchema = createUserBodySchema.omit({
  password: true,
});

export const userLoginResponse = z.object({
  accessToken: z.string().openapi({
    type: "string",
    description: "JWT authorization token for authenticated requests",
  }),
  refreshToken: z.string().openapi({
    type: "string",
    description: "JWT authorization token for authenticated requests",
  }),
  userData: z
    .object({
      id: z
        .string()
        .uuid()
        .openapi({ description: "Unique database identifier" }),
      email: EmailSchema,
      role: RoleSchema,
      accountStatus: z
        .enum(["ACTIVE", "INACTIVE"])
        .openapi({ description: "Current account status flag" }),
      userProfile: createUserBodySchema.omit({
        email: true,
        password: true,
        role: true,
      }),
      createdAt: z
        .string()
        .datetime()
        .openapi({ description: "ISO timestamp of account creation" }),
    })
    .openapi({
      description: "User object profile payload",
    }),
});

// ==========================================
// 4. REGISTRY REGISTER-COMPONENTS
// ==========================================
registry.register("CreateUserRequest", createUserBodySchema);
registry.register("RegistrationResponse", registrationResponseSchema);
registry.register("LoginRequest", loginBodySchema);
registry.register("LoginResponse", userLoginResponse);
registry.register("RequestOtpRequest", requestOtpSchema);
registry.register("VerifyOtpRequest", verifyOtpSchema);
registry.register("SendTestEmailRequest", sendTestEmailSchema);
