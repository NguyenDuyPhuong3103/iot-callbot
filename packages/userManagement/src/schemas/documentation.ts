import { object, string, TypeOf, z } from "zod";

export const createDocumentationSchema = object({
  body: object({
    overview: string({
      required_error: "overview is required",
    }),
    services: string({
      required_error: "Services is required",
    }),
    pricingPolicies: string({
      required_error: "pricingPolicies is required",
    }),
    privacyPolicies: string({
      required_error: "privacyPolicies is required",
    }),
    termOfServices: string({
      required_error: "termOfServices is required",
    }),
    FAQs: string({
      required_error: "FAQs is required",
    })
  })
});


export type CreateDocumentationSchema = TypeOf<typeof createDocumentationSchema>["body"];