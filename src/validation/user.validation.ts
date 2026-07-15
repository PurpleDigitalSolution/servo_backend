import { z } from "zod";

export const updateProfileBodySchema = z.object({
  firstName: z.string().optional().openapi({
    description: "User's given first name",
    example: "John",
  }),
  lastName: z.string().optional().openapi({
    description: "User's family name",
    example: "Doe",
  }),
  email: z.string().email().optional().openapi({
    description: "User's email address",
    example: "john.doe@example.com",
  }),
  phoneNumber: z.string().optional().openapi({
    description: "User's phone number",
    example: "+1234567890",
  }),
  dateOfBirth: z.string().date().optional().openapi({
    description: "User's date of birth in YYYY-MM-DD format",
    example: "1995-06-15",
  }),
});

export const getUsersSchema = z.object({
  page: z.string().regex(/^\d+$/).optional().default("1").openapi({
    description: "Page number for pagination",
    example: "1",
  }),
  limit: z.string().regex(/^\d+$/).optional().default("10").openapi({
    description: "Number of users per page for pagination",
    example: "10",
  }),
});

export const searchUserSchema = z.object({
  query: z.string().min(1).openapi({
    description: "Search query for users",
    example: "John",
  }),
  page: z.string().regex(/^\d+$/).optional().default("1").openapi({
    description: "Page number for pagination",
    example: "1",
  }),
  limit: z.string().regex(/^\d+$/).optional().default("10").openapi({
    description: "Number of users per page for pagination",
    example: "10",
  }),
});

export const searchResponseSchema = z.object({
  users: z.array(
    z.object({
      id: z.string(),
      email: z.email(),
      role: z.enum(["USER", "ADMIN", "SUPER_ADMIN"]),
      accountStatus: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
      createdAt: z.date(),
      userProfile: z
        .object({
          id: z.string(),
          firstName: z.string(),
          lastName: z.string(),
          phoneNumber: z.string(),
          dateOfBirth: z.date(),
          address: z.string(),
          userId: z.string(),
          createdAt: z.date(),
          updatedAt: z.date(),
        })
        .nullable(),
    }),
  ),
  pagination: z.object({
    totalUsers: z.number(),
    totalPages: z.number(),
    currentPage: z.number(),
  }),
});
export const updateProfileResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Unique identifier for the user",
    example: "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
  }),
  firstName: z
    .string()
    .optional()
    .openapi({ description: "User's given first name", example: "John" }),
  lastName: z
    .string()
    .optional()
    .openapi({ description: "User's family name", example: "Doe" }),
  phoneNumber: z
    .string()
    .optional()
    .openapi({ description: "User's phone number", example: "+1234567890" }),
  dateOfBirth: z
    .string()
    .date()
    .optional()
    .openapi({ description: "User's date of birth" }),
});
export const usersSchema = z.object({
  id: z.string().uuid(),
  email: z.email(),
  role: z.enum(["USER", "DRIVER", "ADMIN", "AGENT", "SUPER_ADMIN"]),
  accountStatus: z.enum(["ACTIVE", "SUSPENDED", "BANNED"]),
  userProfile: z.object({
    firstName: z.string(),
    lastName: z.string(),
    phoneNumber: z.string(),
    createdAt: z.iso.datetime(),
  }),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Unique identifier for the user",
    example: "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
  }),
});

// Request wrapper schemas (Used by your Zod Express Validation Middleware)
export const getCustomerRequestSchema = z.object({ query: getUsersSchema });
export const updateProfileRequestSchema = z.object({
  body: updateProfileBodySchema,
});
export const searchRequestSchema = z.object({
  query: searchUserSchema,
});
export const findUserRequestSchema = z.object({
  params: userIdParamSchema,
});
