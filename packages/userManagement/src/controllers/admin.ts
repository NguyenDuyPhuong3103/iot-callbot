import { isAdmin } from "../middleware/authorization";
import { getRepository, DeepPartial } from "typeorm";
import { Request, Response, NextFunction } from "express";
import { User, Service, Project } from "../models";
import {
  CreateUserInput,
  LoginUserSchema,
  ForgotPasswordUserSchema,
} from "../schemas/user";
import { CreateServiceAdminSchema } from "./../schemas/service";
import { StatusCodes } from "http-status-codes";
import { RoleEnumType } from "../models/user";
import { responseFormat } from "../utils/responseFormat";
import { validationResult } from "express-validator";
import sendEmail from "../utils/sendEmail";
import { RequestWithUser } from "../middleware/jwtServices";

class AuthController {
  static async readUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page: number = Number(req.query.page) || 1;
      const limit: number = Number(req.query.limit) || 7;
      const { searchText } = req.query;

      const offset: number = (page - 1) * limit;

      const userRepository = getRepository(User);

      let query = userRepository
        .createQueryBuilder("user")
        .select(["user.id", "user.name"])
        .offset(offset)
        .limit(limit)
        .where("user.role = :role", { role: RoleEnumType.USER });

      if (searchText) {
        query = query
          .where("user.id LIKE :searchText", {
            searchText: `%${searchText}%`,
          })
          .orWhere("user.name LIKE :searchText", {
            searchText: `%${searchText}%`,
          });
      }

      const users: User[] = await query.getMany();

      return res.status(StatusCodes.OK).json(
        responseFormat(
          true,
          {
            message: "Get data successfully !!!",
          },
          users
        )
      );
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error",
      });
    }
  }

  //[POST] /
  static async createUser(req: Request, res: Response, next: NextFunction) {
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
            message: `${email} already exists, Please enter another email!!!`,
          })
        );
      }

      const newUser = userRepository.create(payload);
      await userRepository.save(newUser);

      if (!newUser) {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(
          responseFormat(false, {
            message: "User creation failed!!!",
          })
        );
      }

      return res.status(StatusCodes.OK).json(
        responseFormat(
          true,
          {
            message: "user created successfully!!!",
          },
          newUser
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

  //[POST] /
  static async createServiceByAdmin(
    req: Request,
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

      const payload: CreateServiceAdminSchema = req.body;

      const serviceRepository = getRepository(Service);
      const isNameExist = await serviceRepository.findOne({
        where: { name: payload.name },
      });
      if (isNameExist) {
        return res.status(StatusCodes.BAD_REQUEST).json(
          responseFormat(false, {
            message: `${name} already exists, Please enter another name !!!`,
          })
        );
      }
      const newService: Service = serviceRepository.create(payload);
      await serviceRepository.save(newService);

      if (!newService) {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(
          responseFormat(false, {
            message: "Service registration failed!!!",
          })
        );
      }

      return res.status(StatusCodes.OK).json(
        responseFormat(
          true,
          {
            message: "Service registration successfully!!!",
          },
          newService
        )
      );
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error",
      });
    }
  }

  //[DELETE] /:id
  static async deleteUser(
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
      const userRepository = getRepository(User);

      const userAdminId: string | undefined = req.user?.id;
      const userId: string = req.params?.id;
      const password: string | undefined = req.body.password;

      if (userAdminId && userId && password) {
        const userAdmin: User | null = await userRepository.findOne({
          where: { id: userAdminId },
        });
        if (!userAdmin) {
          return res.status(StatusCodes.BAD_REQUEST).json(
            responseFormat(false, {
              message: `Invalid ${userAdmin} !!!`,
            })
          );
        }

        const isPasswordValid = await userAdmin.comparePasswords(password);
        if (!isPasswordValid) {
          return res.status(StatusCodes.BAD_REQUEST).json(
            responseFormat(false, {
              message: "Password is incorrect !!!",
            })
          );
        }

        const user: User | null = await userRepository.findOne({
          where: { id: userId },
        });
        if (!user) {
          return res.status(StatusCodes.BAD_REQUEST).json(
            responseFormat(false, {
              message: `Invalid ${user} !!!`,
            })
          );
        }

        const isUserDeleted = await userRepository.delete(userId);

        if (!isUserDeleted) {
          return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(
            responseFormat(false, {
              message: "User deletion failed !!!",
            })
          );
        }

        return res.status(StatusCodes.OK).json(
          responseFormat(true, {
            message: "Delete user successfully !!!",
          })
        );
      } else {
        return res.status(StatusCodes.BAD_REQUEST).json(
          responseFormat(false, {
            message: "Invalid user or password !!!",
          })
        );
      }
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        responseFormat(false, {
          message: "Internal Server Error",
          error: error,
        })
      );
    }
  }

  //[GET] /readProfile
  static async readProfileById(
    req: Request,
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

      const userRepository = getRepository(User);

      const userId: string = req.params.id;

      const user = await userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json(
          responseFormat(false, {
            message: `No information found for ${req.params.id}`,
          })
        );
      }

      return res.status(StatusCodes.OK).json(
        responseFormat(
          true,
          {
            message: "Found information successfully !!!",
          },
          user
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

  //[PATCH] /editUserEmail
  static async editUserEmail(req: Request, res: Response) {
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

      const payload: ForgotPasswordUserSchema = req.body;

      const newEmail = payload.email;

      const userRepository = getRepository(User);

      const isEmailExist = await userRepository.findOne({
        where: { email: newEmail },
      });

      if (isEmailExist) {
        return res.status(StatusCodes.BAD_REQUEST).json(
          responseFormat(false, {
            message: `${newEmail} already exists, please enter another email !!!`,
          })
        );
      }

      const userId: string = req.params?.id;

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

      user.email = newEmail;

      const isChangeEmail = await userRepository.save(user);

      if (!isChangeEmail) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "User can not change email !!!",
        });
      }

      const htmlForOldEmail: string = `Your email has been changed from ${user.email} to ${newEmail}.`;

      const subject: string = "change your e-mail";

      const dataForOldEmail = {
        email: user.email as string,
        html: htmlForOldEmail,
        subject,
      };

      const resultForOldEmail = await sendEmail(dataForOldEmail);

      const htmlForNewEmail: string = `${newEmail} has been updated successfully.`;

      const dataForNewEmail = {
        email: newEmail as string,
        html: htmlForNewEmail,
        subject,
      };

      const resultForNewEmail = await sendEmail(dataForNewEmail);

      return res.status(StatusCodes.OK).json(
        responseFormat(true, {
          message: "Change email successfully !!!",
          resultForOldEmail,
          resultForNewEmail,
        })
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

  //[PATCH] /unLockUser
  static async unLockUser(req: Request, res: Response, next: NextFunction) {
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

      const userId: string = req.params?.id;

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

      user.isLocked = false;
      const isActivated = await userRepository.save(user);

      if (!isActivated) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "User has not been activated yet !!!",
        });
      }

      return res.status(StatusCodes.OK).json(
        responseFormat(true, {
          message: "User has been activated !!!",
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

  //[PATCH] /lockUser
  static async lockUser(req: Request, res: Response, next: NextFunction) {
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

      const userId: string = req.params?.id;

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

      user.isLocked = true;
      const isDeactivated = await userRepository.save(user);

      if (!isDeactivated) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "User has not been deactivated yet !!!",
        });
      }

      return res.status(StatusCodes.OK).json(
        responseFormat(true, {
          message: "User has been deactivated !!!",
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

  //[GET] /:id
  static async userHistory(
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId: string | undefined = req.user?.id;
      const projectId: string | undefined = req.params?.id;
      const startDate = new Date(req.params?.startDate);
      const endDate = new Date(req.params?.endDate);

      // const projectRepository = getRepository(Project);

      // if (userId && projectId) {
      //   const projects: Project[] = await projectRepository.find({
      //     where: {
      //       created_by: userId,
      //       createdAt: Between(startDate, endDate),
      //     },
      //   });

      //   if (!projects) {
      //     return res.status(StatusCodes.NOT_FOUND).json(
      //       responseFormat(false, {
      //         message: "Can not find project_id and payload !!!",
      //       })
      //     );
      //   }

      /* 
          Ở phần xem thông tin chi tiết của project, ta sẽ trả về:
            1./ Tên của các services trong project (name)
            2./ Số lượng của từng service đã được sử dụng trong project (data)
                Hướng xử lí: đếm số lần xuất hiện của từng service đó trong cột name
            3./ Trạng thái hoạt động (isActed)
            4./ Giá của từng service (price)
            5./ Tổng tiền đã được thanh toán (cost)
            6./ Số tiền còn nợ chưa trả (unpaid)
        */

      // console.log("line 104, projects: <<<<>>>><<< ", projects);

      // const unique = uniqueValues(projects);

      // console.log("line 108, unique: <<<<>>>><<< ", unique);

      // return res.status(StatusCodes.OK).json(
      //   responseFormat(
      //     true,
      //     {
      //       message: "Get data successfully !!!",
      //     },
      //     projects
      //   )
      // );
      // }
    } catch (error) {
      console.error("Error fetching projects:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error",
      });
    }
  }

  //[DELETE] /:id
  static async deleteService(
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
      const userRepository = getRepository(User);
      const serviceRepository = getRepository(Service);

      const userAdminId: string | undefined = req.user?.id;
      const serviceId: string = req.params?.id;
      const password: string | undefined = req.body.password;

      if (userAdminId && serviceId && password) {
        console.log("userAdminId: <<<>>> <<<", userAdminId);
        const userAdmin = await userRepository.findOne({
          where: { id: userAdminId },
        });
        if (!userAdmin) {
          return res.status(StatusCodes.BAD_REQUEST).json(
            responseFormat(false, {
              message: `Invalid ${userAdmin} !!!`,
            })
          );
        }

        const isPasswordValid = await userAdmin.comparePasswords(password);
        if (!isPasswordValid) {
          return res.status(StatusCodes.BAD_REQUEST).json(
            responseFormat(false, {
              message: "Password is incorrect !!!",
            })
          );
        }

        const service = await serviceRepository.findOne({
          where: { id: serviceId },
        });
        if (!service) {
          return res.status(StatusCodes.BAD_REQUEST).json(
            responseFormat(false, {
              message: `Invalid ${service} !!!`,
            })
          );
        }

        const isServiceDeleted = await serviceRepository.delete(serviceId);

        if (!isServiceDeleted) {
          return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(
            responseFormat(false, {
              message: "service deletion failed !!!",
            })
          );
        }

        return res.status(StatusCodes.OK).json(
          responseFormat(true, {
            message: "Delete service successfully !!!",
          })
        );
      } else {
        return res.status(StatusCodes.BAD_REQUEST).json(
          responseFormat(false, {
            message: "Invalid service or password !!!",
          })
        );
      }
    } catch (error) {
      console.log(error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        responseFormat(false, {
          message: "Internal Server Error",
          error: error,
        })
      );
    }
  }

  //[DELETE] /:id
  static async deleteProject(
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
      const userRepository = getRepository(User);
      const projectRepository = getRepository(Project);

      const userAdminId: string | undefined = req.user?.id;
      const projectId: string = req.params?.id;
      const password: string | undefined = req.body.password;

      if (userAdminId && projectId && password) {
        const userAdmin = await userRepository.findOne({
          where: { id: userAdminId },
        });
        if (!userAdmin) {
          return res.status(StatusCodes.BAD_REQUEST).json(
            responseFormat(false, {
              message: `Invalid ${userAdmin} !!!`,
            })
          );
        }

        const isPasswordValid = await userAdmin.comparePasswords(password);
        if (!isPasswordValid) {
          return res.status(StatusCodes.BAD_REQUEST).json(
            responseFormat(false, {
              message: "Password is incorrect !!!",
            })
          );
        }

        const project = await projectRepository.findOne({
          where: { id: projectId },
        });
        if (!project) {
          return res.status(StatusCodes.BAD_REQUEST).json(
            responseFormat(false, {
              message: `Invalid ${project} !!!`,
            })
          );
        }

        const isProjectDeleted = await projectRepository.delete(projectId);

        if (!isProjectDeleted) {
          return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(
            responseFormat(false, {
              message: "project deletion failed !!!",
            })
          );
        }

        return res.status(StatusCodes.OK).json(
          responseFormat(true, {
            message: "Delete project successfully !!!",
          })
        );
      } else {
        return res.status(StatusCodes.BAD_REQUEST).json(
          responseFormat(false, {
            message: "Invalid project or password !!!",
          })
        );
      }
    } catch (error) {
      console.log(error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        responseFormat(false, {
          message: "Internal Server Error",
          error: error,
        })
      );
    }
  }
}

export default AuthController;
