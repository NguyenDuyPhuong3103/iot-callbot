import { object, string, TypeOf, z } from "zod";

export const createUserSchema = object({
  body: object({
    email: string({
      required_error: "Email address is required",
    }).email("Invalid email address"),
    name: string({
      required_error: "name is required",
    })
      .min(1, "name must be more than 8 characters")
      .max(50, "name must be less than 20 characters"),
    password: string({
      required_error: "Password is required",
    })
      .min(8, "Password must be more than 8 characters")
      .max(50, "Password must be less than 50 characters"),
    passwordConfirm: string({
      required_error: "Please confirm your password",
    }),
  }).refine((data) => data.password === data.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Passwords do not match",
  }),
});

export const changePasswordUserSchema = object({
  body: object({
    currentPassword: string({
      required_error: "current password is required",
    })
      .min(8, "Password must be more than 8 characters")
      .max(50, "Password must be less than 50 characters"),
    newPassword: string({
      required_error: "new password is required",
    })
      .min(8, "Password must be more than 8 characters")
      .max(50, "Password must be less than 50 characters"),
    newPasswordConfirm: string({
      required_error: "Please confirm your new password",
    })
      .min(8, "Password must be more than 8 characters")
      .max(50, "Password must be less than 50 characters"),
  }).refine((data) => data.newPassword === data.newPasswordConfirm, {
    path: ["passwordConfirm"],
    message: "newPasswords do not match",
  }),
});

export const resetPasswordUserSchema = object({
  body: object({
    newPassword: string({
      required_error: "new password is required",
    }),
    newPasswordConfirm: string({
      required_error: "Please confirm your new password",
    }),
  }).refine((data) => data.newPassword === data.newPasswordConfirm, {
    path: ["passwordConfirm"],
    message: "newPasswords do not match",
  }),
});

export const loginUserSchema = object({
  body: object({
    email: string({
      required_error: "Email address is required",
    }).email("Invalid email address"),
    password: string({
      required_error: "Password is required",
    })
      .min(8, "Password must be more than 8 characters")
      .max(50, "Password must be less than 50 characters"),
  }),
});

export const forgotPasswordUserSchema = object({
  body: object({
    email: string({
      required_error: "Email address is required",
    }).email("Invalid email address"),
  }),
});

export const updateUserSchema = object({
  body: object({
    email: string({
      required_error: "Email address is required",
    }).email("Invalid email address"),
    name: string({
      required_error: "Name is required",
    }),
  }),
});

export type CreateUserInput = Partial<
  Omit<TypeOf<typeof createUserSchema>["body"], "passwordConfirm">
>;

export type LoginUserSchema = TypeOf<typeof loginUserSchema>["body"];

export type ChangePasswordUserSchema = Partial<
  Omit<TypeOf<typeof changePasswordUserSchema>["body"], "newPasswordConfirm">
>;

export type ResetPasswordUserSchema = Partial<
  Omit<TypeOf<typeof resetPasswordUserSchema>["body"], "newPasswordConfirm">
>;

export type ForgotPasswordUserSchema = TypeOf<
  typeof forgotPasswordUserSchema
>["body"];

export type UpdateUserSchema = TypeOf<typeof updateUserSchema>["body"];
