import { z } from "zod";

export const addOrUpdateAddressSchema = z.object({
  body: z.object({
    phoneNumber: z
      .string()
      .regex(
        /^[0-9]{10}$/,
        "Phone number must be 10 digits"
      ),

    addressLine1: z
      .string()
      .min(
        5,
        "Address Line 1 at least 5 characters"
      ),

    addressLine2: z
      .string()
      .min(
        1,
        "Address Line 2 is required"
      ),

    city: z
      .string()
      .min(2, "City must be at least 2 characters"),

    state: z
      .string()
      .min(2, "State must be at least 2 characters"),

    pincode: z
      .string()
      .regex(
        /^[0-9]{6}$/,
        "Pincode must be 6 digits"
      ),

    addressId: z
      .string()
      .regex(
        /^[0-9a-fA-F]{24}$/,
        "Invalid address id"
      )
      .optional(),
  }),
});