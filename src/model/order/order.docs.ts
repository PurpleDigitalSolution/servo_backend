import { z } from "zod";
import { registry } from "../../docs/registry.js";
import {
  OrderStatusSchema,
  createOrderRequest,
  listOrdersSchema,
  orderResponseSchema,
} from "../../validation/order.validation.js";

registry.registerPath({
  method: "get",
  path: "/orders/list",
  tags: ["Order Management"],
  summary: "List all orders",
  description: "Retrieves a paginated list of all orders.",
  request: {
    query: listOrdersSchema,
  },
  responses: {
    200: {
      description: "Orders listed successfully",
      content: {
        "application/json": {
          schema: z.object({
            statusCode: z.number().openapi({
              description: "HTTP status code",
              example: 200,
            }),
            message: z.string().openapi({
              description: "Response message",
              example: "Orders listed successfully",
            }),
            page: z.number().openapi({
              description: "Current page number",
              example: 1,
            }),
            limit: z.number().openapi({
              description: "Number of orders per page",
              example: 50,
            }),
            total: z.number().openapi({
              description: "Total number of orders",
              example: 100,
            }),
            orders: z
              .array(
                z.object({
                  id: z.string().uuid(),
                  userId: z.string().uuid(),
                  user: z.object({
                    id: z.string().uuid(),
                    firstName: z.string().min(1).max(50),
                    lastName: z.string().min(1).max(50),
                  }),
                  stationId: z.string().uuid(),
                  status: OrderStatusSchema,
                  fuelType: z.enum(["PETROL", "DIESEL", "COOKING_GAS"]),
                  quantity: z.number().min(1),
                  price: z.number().min(0),
                  station: z.object({
                    id: z.string().uuid(),
                    name: z.string().min(1).max(50),
                  }),
                  createdAt: z.string().datetime(),
                  updatedAt: z.string().datetime(),
                }),
              )
              .openapi({
                description: "List of orders",
                example: [],
              }),
          }),
        },
      },
    },
  },
});
registry.registerPath({
  method: "post",
  path: "/orders/mobile",
  tags: ["Order Management"],
  summary: "Create a new order",
  description: "Creates a new fuel delivery order for an authenticated user.",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: createOrderRequest.shape.body,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Order created successfully",
      content: {
        "application/json": {
          schema: orderResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/orders/{orderId}/status",
  tags: ["Order Management"],
  summary: "Update order status",
  description: "Updates the status of an existing order.",
  request: {
    params: z.object({
      orderId: z.string().uuid().openapi({
        description: "The unique identifier of the order",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
    }),
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({
            status: OrderStatusSchema,
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Order status updated successfully",
      content: {
        "application/json": {
          schema: orderResponseSchema,
        },
      },
    },
  },
});
registry.registerPath({
  method: "get",
  path: "/orders/user/{userId}",
  tags: ["Order Management"],
  summary: "Get orders for a user",
  description: "Retrieves all orders placed by a specific user.",
  request: {
    params: z.object({
      userId: z.string().uuid().openapi({
        description: "The unique identifier of the user",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
    }),
  },
  responses: {
    200: {
      description: "Orders retrieved successfully",
      content: {
        "application/json": {
          schema: z.array(orderResponseSchema),
        },
      },
    },
  },
});
// registry.registerPath({

// })
