import { z } from "zod";
export const stationSchema = z.object({
  name: z.string().min(1, "Station name is required").openapi({
    description: "The name of the station",
    example: "Shell Station",
  }),
  addressState: z.string().min(1, "Address state is required").openapi({
    description: "The state where the station is located",
    example: "California",
  }),
  addressStreet: z.string().min(1, "Address street is required").openapi({
    description: "The street address of the station",
    example: "123 Main Street",
  }),
  addressCity: z.string().min(1, "Address city is required").openapi({
    description: "The city where the station is located",
    example: "Los Angeles",
  }),
  addressCountry: z.string().openapi({
    description: "The country where the station is located",
    example: "USA",
  }),
  latitude: z
    .number()
    .min(-90)
    .max(90, "Latitude must be between -90 and 90")
    .openapi({
      description: "The latitude of the station's location",
      example: 34.0522,
    }),
  longitude: z
    .number()
    .min(-180)
    .max(180, "Longitude must be between -180 and 180")
    .openapi({
      description: "The longitude of the station's location",
      example: -118.2437,
    }),
  openTime: z.string().optional().openapi({
    description: "The opening time of the station in HH:mm format",
    example: "08:00 am",
  }),
  closeTime: z.string().optional().openapi({
    description: "The closing time of the station in HH:mm format",
    example: "08:00 pm",
  }),
  is24h: z.boolean().optional().openapi({
    description: "Indicates if the station operates 24 hours",
    example: true,
  }),
  fuelTypes: z
    .array(z.enum(["PETROL", "DIESEL", "COOKING_GAS"]))
    .min(1, "At least one fuel type is required")
    .optional()
    .openapi({
      description: "The types of fuel available at the station",
      example: ["PETROL", "DIESEL"],
    }),
  prices: z.record(
    z.enum(["PETROL", "DIESEL", "COOKING_GAS"]),
    z
      .number()
      .min(0, "Price must be a positive number")
      .openapi({
        description: "The price of each fuel type",
        example: 3.5,
      })
      .optional(),
  ),
});
export const getStationSchema = z.object({
  page: z.string().regex(/^\d+$/).optional().default("1").openapi({
    description: "Page number for pagination",
    example: "1",
  }),
  limit: z.string().regex(/^\d+$/).optional().default("10").openapi({
    description: "Number of users per page for pagination",
    example: "10",
  }),
});

// Response schema for stations
export const stationResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: "The unique identifier of the station",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  name: z.string().openapi({
    description: "The name of the station",
    example: "Shell Station",
  }),
  addressState: z.string().openapi({
    description: "The state where the station is located",
    example: "California",
  }),
  addressStreet: z.string().openapi({
    description: "The street address of the station",
    example: "123 Main Street",
  }),
  addressCity: z.string().openapi({
    description: "The city where the station is located",
    example: "Los Angeles",
  }),
  addressCountry: z.string().openapi({
    description: "The country where the station is located",
    example: "USA",
  }),
  latitude: z
    .number()
    .min(-90)
    .max(90, "Latitude must be between -90 and 90")
    .openapi({
      description: "The latitude of the station's location",
      example: 34.0522,
    }),
  longitude: z
    .number()
    .min(-180)
    .max(180, "Longitude must be between -180 and 180")
    .openapi({
      description: "The longitude of the station's location",
      example: -118.2437,
    }),
  openTime: z.string().optional().openapi({
    description: "The opening time of the station in HH:mm format",
    example: "08:00 am",
  }),
  closeTime: z.string().optional().openapi({
    description: "The closing time of the station in HH:mm format",
    example: "08:00 pm",
  }),
  is24h: z.boolean().optional().openapi({
    description: "Indicates if the station operates 24 hours",
    example: true,
  }),
  fuelTypes: z
    .array(z.enum(["PETROL", "DIESEL", "COOKING_GAS"]))
    .min(1, "At least one fuel type is required")
    .openapi({
      description: "The types of fuel available at the station",
      example: ["PETROL", "DIESEL"],
    }),
  prices: z.record(
    z.enum(["PETROL", "DIESEL", "COOKING_GAS"]),
    z
      .number()
      .min(0, "Price must be a positive number")
      .openapi({
        description: "The price of each fuel type",
        example: 3.5,
      })
      .optional(),
  ),
  createdAt: z.string().openapi({
    description: "The date and time when the station was created",
    example: "2023-01-01T12:00:00Z",
  }),
  updatedAt: z.string().openapi({
    description: "The date and time when the station was last updated",
    example: "2023-01-02T12:00:00Z",
  }),
});
export const SstationResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: "The unique identifier of the station",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  name: z.string().openapi({
    description: "The name of the station",
    example: "Shell Station",
  }),
  addressState: z.string().openapi({
    description: "The state where the station is located",
    example: "California",
  }),
  addressStreet: z.string().openapi({
    description: "The street address of the station",
    example: "123 Main Street",
  }),
  addressCity: z.string().openapi({
    description: "The city where the station is located",
    example: "Los Angeles",
  }),
  isAvailable: z.boolean().openapi({
    description: "Indicates if the station is currently available",
    example: true,
  }),
  is24h: z.boolean().optional().openapi({
    description: "Indicates if the station operates 24 hours",
    example: true,
  }),
  fuelTypes: z
    .array(z.enum(["PETROL", "DIESEL", "COOKING_GAS"]))
    .min(1, "At least one fuel type is required")
    .optional()
    .openapi({
      description: "The types of fuel available at the station",
      example: ["PETROL", "DIESEL"],
    }),
  prices: z.record(
    z.enum(["PETROL", "DIESEL", "COOKING_GAS"]),
    z
      .number()
      .min(0, "Price must be a positive number")
      .openapi({
        description: "The price of each fuel type",
        example: 3.5,
      })
      .optional(),
  ),
  createdAt: z.string().openapi({
    description: "The date and time when the station was created",
    example: "2023-01-01T12:00:00Z",
  }),
});

// request schema for stations
export const stationRequestSchema = z.object({
  body: stationSchema,
});
