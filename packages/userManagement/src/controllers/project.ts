import { getRepository, DeepPartial, Between, FindOptionsWhere } from "typeorm";
import { Request, Response, NextFunction } from "express";
import { Project, User, Service, History } from "../models";
import { StatusCodes } from "http-status-codes";
import { responseFormat } from "../utils/responseFormat";
import { validationResult } from "express-validator";
import {
  RequestWithUser,
  signProjectAccessToken,
  signProjectRefreshToken,
  verifyProjectRefreshToken,
} from "../middleware/jwtServices";
import { CreateProjectSchema, EditProjectSchema } from "../schemas/project";

export function uniqueValues(column: any[]): any[] {
  return Array.from(new Set(column));
}

class ProjectController {
  //[GET] /
  static async readProjects(
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId: string | undefined = req.user?.id;

      const page: number = Number(req.query.page) || 1;
      const limit: number = Number(req.query.limit) || 7;
      const { searchText } = req.query;

      const offset: number = (page - 1) * limit;

      const projectRepository = getRepository(Project);

      let query = projectRepository
        .createQueryBuilder("project")
        .andWhere("project.id = :projectId", { projectId: userId })
        .where({ createdBy: userId })
        .select(["project.id", "project.name"])
        .offset(offset)
        .limit(limit);

      if (searchText) {
        query = query.andWhere((qb) => {
          return qb
            .where("CAST(project.id AS TEXT) LIKE :searchText", {
              searchText: `%${searchText}%`,
            })
            .orWhere("project.name LIKE :searchText", {
              searchText: `%${searchText}%`,
            });
        });
      }

      const projects: Project[] = await query.getMany();

      return res.status(StatusCodes.OK).json(
        responseFormat(
          true,
          {
            message: "Get data successfully !!!",
          },
          projects
        )
      );
    } catch (error) {
      console.error("Error fetching projects:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error",
      });
    }
  }

  //[GET] /:id
  static async projectDetail(
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId: string | undefined = req.user?.id;
      const projectId: string | undefined = req.params?.id;
      const startDate: Date | undefined = req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined;
      const endDate: Date | undefined = req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined;

      const projectRepository = getRepository(Project);
      const userRepository = getRepository(User);
      const serviceRepository = getRepository(Service);

      if (userId && projectId) {
        const user = await userRepository.findOne({
          where: { id: userId },
          select: ["id"],
        });
        if (!user) {
          return res.status(StatusCodes.NOT_FOUND).json(
            responseFormat(false, {
              message: `${userId} not found !!!`,
            })
          );
        }

        const project = await projectRepository.findOne({
          where: {
            id: projectId,
            createdBy: user,
          },
          select: ["id"],
        });
        if (!project) {
          return res.status(StatusCodes.NOT_FOUND).json(
            responseFormat(false, {
              message: `${userId} not found !!!`,
            })
          );
        }

        let services: Service[];

        if (startDate && endDate) {
          const newEndDate = new Date(endDate.getTime());
          newEndDate.setDate(newEndDate.getDate() + 1);
          services = await serviceRepository.find({
            where: {
              inProject: project,
              createdAt: Between(startDate, newEndDate),
            },
            select: ["createdAt", "name", "sumCost", "isActed"],
          });
        } else {
          services = await serviceRepository.find({
            where: {
              inProject: project,
            },
            select: ["createdAt", "name", "sumCost", "isActed"],
          });
        }

        if (!services) {
          return res.status(StatusCodes.NOT_FOUND).json(
            responseFormat(false, {
              message: "Can not find project_id and payload !!!",
            })
          );
        } else {
          return res.status(StatusCodes.OK).json(
            responseFormat(
              true,
              {
                message: "Get data successfully !!!",
              },
              services
            )
          );
        }
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error",
      });
    }
  }

  //[GET] /:id
  static async projectHistory(
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId: string | undefined = req.user?.id;
      const projectId: string | undefined = req.params?.id;
      const startDate: Date | undefined = req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined;
      const endDate: Date | undefined = req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined;

      const projectRepository = getRepository(Project);
      const userRepository = getRepository(User);
      const historyRepository = getRepository(History);

      if (userId && projectId) {
        const user = await userRepository.findOne({
          where: { id: userId },
          select: ["id"],
        });
        if (!user) {
          return res.status(StatusCodes.NOT_FOUND).json(
            responseFormat(false, {
              message: `${userId} not found !!!`,
            })
          );
        }

        const project = await projectRepository.findOne({
          where: {
            id: projectId,
            createdBy: user,
          },
          select: ["id"],
        });
        if (!project) {
          return res.status(StatusCodes.NOT_FOUND).json(
            responseFormat(false, {
              message: `${userId} not found !!!`,
            })
          );
        }

        let historys: History[];

        if (startDate && endDate) {
          const newEndDate = new Date(endDate.getTime());
          newEndDate.setDate(newEndDate.getDate() + 1);
          historys = await historyRepository.find({
            where: {
              inProject: project,
              createdAt: Between(startDate, newEndDate),
            },
            select: ["name", "content", "cost", "createdAt"],
          });
        } else {
          historys = await historyRepository.find({
            where: {
              inProject: project,
            },
            select: ["name", "content", "cost", "createdAt"],
          });
        }

        if (!historys) {
          return res.status(StatusCodes.NOT_FOUND).json(
            responseFormat(false, {
              message: "Can not find project_id and payload !!!",
            })
          );
        } else {
          return res.status(StatusCodes.OK).json(
            responseFormat(
              true,
              {
                message: "Get data successfully !!!",
              },
              historys
            )
          );
        }
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error",
      });
    }
  }

  //[POST] /
  static async createProject(
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

      const payload: CreateProjectSchema = req.body;
      const userRepository = getRepository(User);

      const { name } = payload;

      const projectRepository = getRepository(Project);

      if (userId && payload) {
        const user = await userRepository.findOne({
          where: { id: userId },
          select: ["id"],
        });
        if (!user) {
          return res.status(StatusCodes.NOT_FOUND).json(
            responseFormat(false, {
              message: `${userId} not found !!!`,
            })
          );
        }
        const isNameExist = await projectRepository.findOne({
          where: { name: name, createdBy: user },
        });
        if (isNameExist) {
          return res.status(StatusCodes.BAD_REQUEST).json(
            responseFormat(false, {
              message: `${name} already exists, Please enter another name !!!`,
            })
          );
        }

        const data: DeepPartial<Project> = {
          ...payload,
          createdBy: user,
        };

        const newProject: Project = projectRepository.create(data);
        await projectRepository.save(newProject);

        if (!newProject) {
          return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(
            responseFormat(false, {
              message: "Project creation failed!!!",
            })
          );
        }

        const accessProjectToken = await signProjectAccessToken(newProject.id);
        const refreshProjectToken = await signProjectRefreshToken(
          newProject.id
        );

        newProject.refreshProjectToken = refreshProjectToken;
        await projectRepository.save(newProject);

        res.cookie("refreshProjectToken", refreshProjectToken, {
          httpOnly: false,
          maxAge: 6 * 30 * 24 * 60 * 60 * 1000,
        });

        return res.status(StatusCodes.OK).json(
          responseFormat(
            true,
            {
              message: "Project creation successful!!!",
            },
            { newProject, accessProjectToken }
          )
        );
      } else {
        return res.status(StatusCodes.NOT_FOUND).json(
          responseFormat(false, {
            message: "Can not find user_id and payload !!!",
          })
        );
      }
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        responseFormat(false, {
          message: "Internal Server Error",
          error: error,
        })
      );
    }
  }

  //[PUT] /
  static async editProject(
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
      const projectId: string | undefined = req.params?.id;

      const newName: EditProjectSchema = req.body;

      const userRepository = getRepository(User);
      const user = await userRepository.findOne({
        where: { id: userId },
        select: ["id"],
      });
      if (!user) {
        return res.status(StatusCodes.BAD_REQUEST).json(
          responseFormat(false, {
            message: `Invalid ${user} !!!`,
          })
        );
      }

      const projectRepository = getRepository(Project);

      const project = await projectRepository.findOne({
        where: {
          id: projectId,
          createdBy: user,
        },
      });

      if (!project) {
        return res.status(StatusCodes.NOT_FOUND).json(
          responseFormat(false, {
            message: "Can not find project_id !!!",
          })
        );
      }

      const isNameExist = await projectRepository.findOne({
        where: { name: newName.name, id: projectId },
      });

      if (isNameExist) {
        return res.status(StatusCodes.BAD_REQUEST).json(
          responseFormat(false, {
            message: `${newName.name} already exists, please enter another name !!!`,
          })
        );
      }

      const isNameChanged = await projectRepository.update(projectId, {
        name: newName.name,
      });

      if (!isNameChanged) {
        return res.status(StatusCodes.BAD_REQUEST).json(
          responseFormat(false, {
            message: "Project has not been updated!!!",
          })
        );
      }

      return res.status(StatusCodes.OK).json(
        responseFormat(true, {
          message: "Project has been updated successfully!!!",
        })
      );
    } catch (error) {
      console.log(error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        responseFormat(false, {
          message: "Internal Server Error",
          error: error,
        })
      );
    }
  }

  //[get] /refreshProjectToken
  static async refreshProjectToken(
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

      const cookie = req.cookies;
      if (!cookie || !cookie.refreshProjectToken) {
        res.status(StatusCodes.BAD_REQUEST).json(
          responseFormat(false, {
            message: "No refreshProjectToken found in cookie !!!",
          })
        );
        return;
      }

      const projectId: { id: string } = await verifyProjectRefreshToken(
        cookie.refreshProjectToken
      );
      if (!projectId) {
        res.status(StatusCodes.BAD_REQUEST).json(
          responseFormat(false, {
            message: "Invalid refreshToken found in cookie !!!",
          })
        );
        return;
      }

      const password: string | undefined = req.body.password;
      const userId: string | undefined = req.user?.id;

      if (userId && password && cookie.refreshProjectToken) {
        const userRepository = getRepository(User);
        const user = await userRepository.findOne({
          where: { id: userId },
          select: ["password"],
        });
        if (!user) {
          return res.status(StatusCodes.BAD_REQUEST).json(
            responseFormat(false, {
              message: `Invalid ${user} !!!`,
            })
          );
        }

        const isPasswordValid = await user.comparePasswords(password);
        if (!isPasswordValid) {
          return res.status(StatusCodes.BAD_REQUEST).json(
            responseFormat(false, {
              message: "Password is incorrect !!!",
            })
          );
        }

        const projectRepository = getRepository(Project);

        const { tempPassword, ...userProject } = user;

        const project = await projectRepository.findOne({
          where: {
            id: projectId.id,
            createdBy: userProject,
            refreshProjectToken: cookie.refreshProjectToken,
          },
        });

        if (!project) {
          return res.status(StatusCodes.NOT_FOUND).json(
            responseFormat(false, {
              message: "Can not find project_id !!!",
            })
          );
        }

        const accessProjectToken = await signProjectAccessToken(project.id);
        const refreshProjectToken = await signProjectRefreshToken(project.id);

        project.refreshProjectToken = refreshProjectToken;
        await projectRepository.save(project);

        res.cookie("refreshProjectToken", refreshProjectToken, {
          httpOnly: false,
          maxAge: 6 * 30 * 24 * 60 * 60 * 1000,
        });

        return res.status(StatusCodes.OK).json(
          responseFormat(
            true,
            {
              message: "Update refreshToken successfully!!!",
            },
            accessProjectToken
          )
        );
      }
    } catch (error) {
      console.log(error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        responseFormat(false, {
          message: "Internal Server Error!!!",
          error: error,
        })
      );
    }
  }
}

export default ProjectController;
