import { object, string, number, TypeOf, z } from "zod";

export const createServiceSchema = object({
  body: object({
    name: string({
      required_error: "name is required",
    }),
    introduction: string({
      required_error: "introduction is required",
    }),
    information: string({
      required_error: "information is required",
    }),
    content: string({
      required_error: "content is required",
    }),
    price: number().transform((val) => val ?? 0),
  }),
});

export type CreateServiceAdminSchema = Partial<
  Omit<TypeOf<typeof createServiceSchema>["body"], "content">
>;

export type CreateServiceByUserSchema = Partial<
  Omit<
    TypeOf<typeof createServiceSchema>["body"],
    "introduction" | "information" | "price" | "content"
  >
>;

export type EditServiceByUserSchema = Partial<
  Omit<
    TypeOf<typeof createServiceSchema>["body"],
    "introduction" | "information" | "price" | "name"
  >
>;
