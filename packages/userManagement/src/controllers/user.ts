import { getRepository, MoreThan } from "typeorm";
import { Request, Response, NextFunction } from "express";
import { User } from "../models";
import { StatusCodes } from "http-status-codes";
import { responseFormat } from "../utils/responseFormat";
import { validationResult } from "express-validator";
import { RoleEnumType } from "../models/user";
import {
  RequestWithUser,
  verifyUserAccessToken,
} from "../middleware/jwtServices";
import bcrypt from "bcryptjs";
import sendEmail from "../utils/sendEmail";
import crypto from "crypto";
import {
  CreateUserInput,
  LoginUserSchema,
  ChangePasswordUserSchema,
  ResetPasswordUserSchema,
  UpdateUserSchema,
} from "../schemas/user";
import {
  UserPayload,
  signUserAccessToken,
  signUserRefreshToken,
  verifyUserRefreshToken,
} from "../middleware/jwtServices";
import jwt from "jsonwebtoken";
import axios from "axios";
import fs from "fs";
import FormData from "form-data";

class UserController {
  //[POST] /register
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(StatusCodes.BAD_REQUEST).json(
          responseFormat(false, {
            message: "Validation error in request body",
            errors: errors.array(),
          })
        );
      }

      const payload: CreateUserInput = req.body;

      const { email } = payload;

      const userRepository = getRepository(User);

      const isEmailExist = await userRepository.findOne({
        where: { email: email },
      });
      if (isEmailExist) {
        return res.status(StatusCodes.BAD_REQUEST).json(
          responseFormat(false, {
            message: `${email} already exists, please enter another email!!!`,
          })
        );
      }

      const newUser: User = userRepository.create(payload);
      await userRepository.save(newUser);

      if (!newUser) {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(
          responseFormat(false, {
            message: "User registration failed!!!",
          })
        );
      }

      const confirmUserToken: string = await signUserAccessToken(
        newUser.id,
        newUser.role
      );

      const html: string = `Please click the link below to confirm your account. This link will expire 15 minutes from now. 
          <a href="${process.env.URL_SERVER}/api/user/confirmRegisterUser/${confirmUserToken}">Click here</a>`;

      const subject: string = "Confirm your account";

      const data = {
        email: email as string,
        html,
        subject,
      };

      const result = await sendEmail(data);

      return res.status(StatusCodes.OK).json(
        responseFormat(
          true,
          {
            message: "User registration successful!!!",
          },
          result
        )
      );
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        responseFormat(false, {
          message: "Internal Server Error",
          error: error,
        })
      );
    }
  }

  //[GET] /confirmRegisterUser
  static async confirmRegisterUser(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const confirmUserToken: string = req.params?.confirmUserToken;

      if (!confirmUserToken) {
        return res.status(StatusCodes.NOT_FOUND).json(
          responseFormat(false, {
            message: `User id and password not found!!!`,
          })
        );
      }

      await jwt.verify(
        confirmUserToken,
        process.env.ACCESS_TOKEN_SECRET || "",
        async (err, decode) => {
          if (err) {
            return res.status(StatusCodes.UNAUTHORIZED).json(
              responseFormat(false, {
                message: `The token is invalid !!!`,
                err: err,
              })
            );
          }
          const { id, role } = decode as UserPayload;

          const userRepository = getRepository(User);

          const user = await userRepository.findOne({
            where: { id: id },
          });

          if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json(
              responseFormat(false, {
                message: `Confirm user token is invalid !!!`,
              })
            );
          } else {
            user.isConfirmed = true;
            await userRepository.save(user);

            return res.status(StatusCodes.OK).json(
              responseFormat(
                true,
                {
                  message: `Account confirmed successfully !!!`,
                },
                user
              )
            );
          }
        }
      );
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        responseFormat(false, {
          message: `Co loi o server reset password!!!`,
          error: error,
        })
      );
    }
  }

  //[POST] /login
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(StatusCodes.BAD_REQUEST).json(
          responseFormat(false, {
            message: "Validation error in request body",
            errors: errors.array(),
          })
        );
      }

      const payload: LoginUserSchema = req.body;

      const { email, password } = payload;

      const userRepository = getRepository(User);

      const isEmailExist = await userRepository.findOne({
        where: { email: email },
      });
      if (!isEmailExist) {
        return res.status(StatusCodes.NOT_FOUND).json(
          responseFormat(false, {
            message: `This email: ${email} is not in use yet!!!`,
          })
        );
      }

      if (!isEmailExist.isConfirmed) {
        return res.status(StatusCodes.BAD_REQUEST).json(
          responseFormat(false, {
            message: `Please confirm your email!!!`,
          })
        );
      }

      const isValid = await isEmailExist.comparePasswords(password);

      if (!isValid) {
        return res.status(StatusCodes.BAD_REQUEST).json(
          responseFormat(false, {
            message: "Wrong password or email!!!",
          })
        );
      } else {
        const { id, password, role, ...userData } = isEmailExist;
        const accessToken = await signUserAccessToken(
          isEmailExist.id,
          isEmailExist.role
        );
        const refreshToken = await signUserRefreshToken(isEmailExist.id);

        isEmailExist.refreshToken = refreshToken;
        await userRepository.save(isEmailExist);

        res.cookie("refreshToken", refreshToken, {
          httpOnly: false,
          maxAge: 6 * 30 * 24 * 60 * 60 * 1000,
        });

        return res.status(StatusCodes.ACCEPTED).json(
          responseFormat(
            true,
            {
              message: "Logged in successfully!!!",
            },
            {
              accessToken,
              isEmailExist,
            }
          )
        );
      }
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        responseFormat(false, {
          message: "Internal Server Error",
          error: error,
        })
      );
    }
  }

  //[get] /refreshToken
  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const cookie = req.cookies;
      if (!cookie || !cookie.refreshToken) {
        res.status(StatusCodes.BAD_REQUEST).json(
          responseFormat(false, {
            message: "No refreshToken found in cookie !!!",
          })
        );
        return;
      }

      const isDataVerified: { id: string } = await verifyUserRefreshToken(
        cookie.refreshToken
      );

      const userRepository = getRepository(User);
      const user = await userRepository.findOne({
        where: {
          id: isDataVerified.id,
          refreshToken: cookie.refreshToken,
        },
      });

      if (!user) {
        res.status(StatusCodes.BAD_REQUEST).json(
          responseFormat(false, {
            message: "No valid user found!!!",
          })
        );
        return;
      }

      const newAccessToken = await signUserAccessToken(user.id, user.role);
      const newRefreshToken = await signUserRefreshToken(user.id);

      const userToUpdate = await userRepository.findOne({
        where: {
          refreshToken: req.cookies.refreshToken,
        },
      });

      if (userToUpdate) {
        userToUpdate.refreshToken = newRefreshToken;
        await userRepository.save(userToUpdate);
      }

      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: false,
        maxAge: 6 * 30 * 24 * 60 * 60 * 1000,
      });

      res.status(StatusCodes.OK).json(
        responseFormat(
          true,
          {
            message: "Update refreshToken successfully!!!",
          },
          newAccessToken
        )
      );
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        responseFormat(false, {
          message: "Internal Server Error!!!",
          error: error,
        })
      );
    }
  }

  //[get] /logout
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const userRepository = getRepository(User);
      const deletedUser = await userRepository.update(
        { refreshToken: req.cookies.refreshToken },
        { refreshToken: "" }
      );

      if (deletedUser) {
        await res.clearCookie("refreshToken", {
          httpOnly: false,
          secure: true,
        });

        res.status(StatusCodes.OK).json({
          success: true,
          message: "You have successfully logged out !!!",
        });
        return;
      } else {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "refreshToken not found !!!",
        });
        return;
      }
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal Server Error",
        error: error,
      });
      return;
    }
  }

  //[PUT] /updateProfile
  static async updateProfile(
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(StatusCodes.BAD_REQUEST).json(
          responseFormat(false, {
            message: "Validation error in request body",
            errors: errors.array(),
          })
        );
      }

      const userId: string | undefined = req.user?.id;
      const payload: UpdateUserSchema = req.body;

      let avatar: string | null = null;
      if (req.file) {
        const uploadUrl = process.env.UPLOAD_IMAGE_URL;
        const formData = new FormData();
        formData.append("file", fs.createReadStream(req.file.path));
        if (uploadUrl) {
          const response = await axios.post(uploadUrl, formData, {
            headers: { ...formData.getHeaders() },
          });
          avatar = response.data.data.id;
        }
      }

      const userRepository = getRepository(User);

      if (userId && payload && avatar) {
        const userDataToUpdate = { ...payload, avatar };
        const isUserUpdated = await userRepository.update(
          userId,
          userDataToUpdate
        );
        if (!isUserUpdated) {
          return res.status(StatusCodes.NOT_FOUND).json(
            responseFormat(false, {
              message: `No information found for ${userId}`,
            })
          );
        }
      } else {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
          responseFormat(false, {
            message: "Internal Server Error",
          })
        );
      }

      const userAfterUpdate = await userRepository.findOne({
        where: { id: userId },
      });

      return res.status(StatusCodes.OK).json(
        responseFormat(
          true,
          {
            message: "The data has been updated !!!",
          },
          userAfterUpdate
        )
      );
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        responseFormat(false, {
          message: "Internal Server Error",
          error: error,
        })
      );
    }
  }

  //[PUT] /changePassword
  static async changePassword(
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(StatusCodes.BAD_REQUEST).json(
          responseFormat(false, {
            message: "Validation error in request body",
            errors: errors.array(),
          })
        );
      }

      const userId: string | undefined = req.user?.id;

      const payload: ChangePasswordUserSchema = req.body;

      const currentPassword: string = payload.currentPassword ?? "";
      const newPassword: string = payload.newPassword ?? "";

      const userRepository = getRepository(User);

      const user = await userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json(
          responseFormat(false, {
            message: `${userId} not found !!!`,
          })
        );
      }

      const isPasswordValid = await user.comparePasswords(currentPassword);
      if (!isPasswordValid) {
        return res.status(StatusCodes.BAD_REQUEST).json(
          responseFormat(false, {
            message: `Current password is incorrect !!!`,
          })
        );
      }

      const isHashNewPassword = await bcrypt.hash(newPassword, 12);
      user.password = isHashNewPassword;
      const isPasswordChanged = await userRepository.save(user);

      if (!isPasswordChanged) {
        return res.status(StatusCodes.BAD_REQUEST).json(
          responseFormat(false, {
            message: `Password has not been changed !!!`,
          })
        );
      }

      return res.status(StatusCodes.OK).json(
        responseFormat(true, {
          message: "Changed password successfully!!!",
        })
      );
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        responseFormat(false, {
          message: "Internal Server Error",
          error: error,
        })
      );
    }
  }

  //[GET] /forgotPassword
  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.query;
      if (!email || typeof email !== "string") {
        return res.status(StatusCodes.NOT_FOUND).json(
          responseFormat(false, {
            message: `Invalid email address !!!`,
          })
        );
      }

      const userRepository = getRepository(User);

      const user = await userRepository.findOne({
        where: { email: email },
      });
      if (!user) {
        return res.status(StatusCodes.BAD_REQUEST).json(
          responseFormat(false, {
            message: `${email} is not used, please enter another email!!!`,
          })
        );
      }

      // 1. Tạo chuỗi token xác thực khi client quên password
      const resetToken: string | undefined =
        await user.createPasswordChangedToken();
      await userRepository.save(user);

      // 2. Gửi mail
      const html: string = `Please click the link below to change your password. This link will expire 15 minutes from now.
          <a href="${process.env.URL_SERVER}/api/user/verifyForgotPassword/${resetToken}">Click here</a>`;

      const subject: string = "Reset Password";

      const data = {
        email: email as string,
        html,
        subject,
      };

      const result = await sendEmail(data);

      return res.status(StatusCodes.OK).json(responseFormat(true, result));
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        responseFormat(false, {
          message: `Co loi o server reset password!!!`,
          error: error,
        })
      );
    }
  }

  //[GET] /verifyForgotPassword
  static async verifyForgotPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const resetToken: string = req.params?.resetToken;

      if (!resetToken) {
        return res.status(StatusCodes.NOT_FOUND).json(
          responseFormat(false, {
            message: `Token not found !!!`,
          })
        );
      }

      const passwordResetToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      const userRepository = getRepository(User);

      const user = await userRepository.findOne({
        where: {
          passwordResetToken,
          passwordResetExpires: MoreThan(new Date()),
        },
      });
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json(
          responseFormat(false, {
            message: `Invalid reset token !!!`,
          })
        );
      } else {
        return res.status(StatusCodes.OK).json(
          responseFormat(
            true,
            {
              message: `Valid OTP`,
            },
            user.id
          )
        );
      }
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        responseFormat(false, {
          message: `There is an error in the server verify forgot password !!!`,
          error: error,
        })
      );
    }
  }

  //[PUT] /resetPassword
  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const id: string = req.params?.id;
      const payload: ResetPasswordUserSchema = req.body;

      if (!id && !payload) {
        return res.status(StatusCodes.NOT_FOUND).json(
          responseFormat(false, {
            message: `User id and new password not found !!!`,
          })
        );
      }

      const newPassword: string = payload.newPassword ?? "";

      const userRepository = getRepository(User);

      const user = await userRepository.findOne({
        where: { id: id },
      });

      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json(
          responseFormat(false, {
            message: `Invalid reset token !!!`,
          })
        );
      } else {
        const isHashNewPassword = await bcrypt.hash(newPassword, 12);
        user.password = isHashNewPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.passwordChangeAt = new Date();
        await userRepository.save(user);

        return res.status(StatusCodes.OK).json(
          responseFormat(
            true,
            {
              message: `Password changed successfully !!!`,
            },
            user
          )
        );
      }
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        responseFormat(false, {
          message: `There was an error in the password reset server !!!`,
          error: error,
        })
      );
    }
  }
}

export default UserController;
