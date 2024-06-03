import { object, string, TypeOf, z } from "zod";

export function isValidPhoneNumber(value: string): boolean {
  const phoneNumberRegex = /^\+84\d{9}$/;
  return phoneNumberRegex.test(value);
}

export const createContactSchema = object({
  body: object({
    fullName: string({
      required_error: "Full Name is required",
    })
      .min(8, "Password must be more than 8 characters")
      .max(100, "Password must be less than 100 characters"),
    email: string({
      required_error: "Email is required",
    }).email("Invalid email address"),
    phoneNumber: string({
      required_error: "Phone Number is required",
    }).refine(isValidPhoneNumber, "Invalid phone number"),
    company: string({
      required_error: "Company is required",
    })
      .min(0, "Password must be more than 0 characters")
      .max(100, "Password must be less than 100 characters"),
    yourMessage: string({
      required_error: "Your Message is required",
    })
      .min(0, "Password must be more than 0 characters")
      .max(500, "Password must be less than 500 characters"),
  }),
});

export type CreateContactSchema = TypeOf<typeof createContactSchema>["body"];
