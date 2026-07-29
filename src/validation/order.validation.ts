import { z } from "zod";

export const OrderStatusSchema = z
  .enum([
    "PENDING_PAYMENT",
    "PENDING_CONFIRMATION",
    "CONFIRMED",
    "COMPLETED",
    "CANCELLED",
    "ASSIGNED",
    "ARRIVED",
    "IN_TRANSIT",
  ])
  .openapi({
    description: "The status of the order",
    example: "PENDING_PAYMENT",
  });

export const FuelTypeSchema = z
  .enum(["PETROL", "DIESEL", "COOKING_GAS"])
  .openapi({
    description: "The type of fuel for the order",
    example: "PETROL",
  });

export const orderSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required").openapi({
    description: "The ID of the customer placing the order",
  }),
  stationId: z.string().min(1, "Station ID is required").openapi({
    description: "The ID of the station where the order is placed",
  }),
  status: OrderStatusSchema,
  fuelType: FuelTypeSchema,
  quantity: z.number().min(1, "Quantity must be at least 1").openapi({
    description: "The quantity of fuel ordered",
    example: 10,
  }),
  totalPrice: z.number().min(0, "Price must be a positive number").openapi({
    description: "The total price of the order",
    example: 50.0,
  }),
  deliveryAddress: z.string().min(1, "Delivery address is required").openapi({
    description: "The address where the fuel should be delivered",
    example: "123 Main Street, City, State, ZIP",
  }),
  VAT: z.number().min(0, "VAT must be a positive number").openapi({
    description: "The VAT amount for the order",
    example: 5.0,
  }),
  deliveryFee: z
    .number()
    .min(0, "Delivery fee must be a positive number")
    .openapi({
      description: "The delivery fee for the order",
      example: 2.5,
    }),
});
export const orderResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: "The unique identifier of the order",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  customerId: z.string().min(1).openapi({
    description: "The ID of the customer who placed the order",
    example: "customer123",
  }),
  stationId: z.string().uuid().openapi({
    description: "The ID of the station where the order is placed",
    example: "station123",
  }),
  status: OrderStatusSchema,
  fuelType: FuelTypeSchema,
  quantity: z.number().min(1).openapi({
    description: "The quantity of fuel ordered",
    example: 10,
  }),
  totalPrice: z.number().min(0).openapi({
    description: "The total price of the order",
    example: 50.0,
  }),
  deliveryAddress: z.string().min(1).openapi({
    description: "The address where the fuel should be delivered",
    example: "123 Main Street, City, State, ZIP",
  }),
  createdAt: z.string().datetime().openapi({
    description: "The date and time when the order was created",
    example: "2023-10-01T12:34:56Z",
  }),
  updatedAt: z.string().datetime().openapi({
    description: "The date and time when the order was last updated",
    example: "2023-10-02T14:56:78Z",
  }),
  station: z
    .object({
      id: z.string().uuid(),
      name: z.string().min(2).max(100),
    })
    .optional(),
  payResponse: z.object({
    orderId: z.string().uuid().openapi({
      description: "The unique identifier of the order",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
    authorizationUrl: z.string().url().openapi({
      description: "The URL for authorizing the payment",
      example: "https://example.com/authorize",
    }),
    reference: z.string().uuid().openapi({
      description: "The reference for the transaction",
      example: "TNX_ORD_1234567890",
    }),
  }),
});
export const listOrdersSchema = z.object({
  page: z.number().int().min(1).optional().openapi({
    description: "The page number for pagination",
    example: 1,
  }),
  limit: z.number().int().min(1).max(100).optional().openapi({
    description: "The number of orders to retrieve per page",
    example: 10,
  }),
});
export const createOrderRequest = z.object({
  body: orderSchema,
});

export const listOrdersRequest = z.object({
  query: listOrdersSchema,
});
export const idRequestSchema = z.object({
  params: z.object({
    id: z.string().uuid().openapi({
      description: "Unique identifier for the user",
      example: "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
    }),
  }),
});
