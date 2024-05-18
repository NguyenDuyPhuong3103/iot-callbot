import { object, string, TypeOf, z } from "zod";

export const createProjectSchema = object({
  body: object({
    name: string({
      required_error: "name is required",
    }),
  }),
});

export type CreateProjectSchema = TypeOf<typeof createProjectSchema>["body"];
export type EditProjectSchema = TypeOf<typeof createProjectSchema>["body"];
