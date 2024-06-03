import { History } from "../models/history";
import { getRepository, DeepPartial, IsNull } from "typeorm";
import { Request, Response, NextFunction } from "express";
import { Service, Project, User } from "../models";
import {
  CreateServiceByUserSchema,
  EditServiceByUserSchema,
} from "../schemas/service";
import { StatusCodes } from "http-status-codes";
import { responseFormat } from "../utils/responseFormat";
import { validationResult } from "express-validator";
import { RequestWithUser } from "../middleware/jwtServices";

class ServiceController {
  //[POST] /
  static async createServiceByUser(
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
      const projectId: string | undefined = req.params?.projectId;
      const serviceId: string | undefined = req.params?.serviceId;

      if (projectId && serviceId) {
        const projectRepository = getRepository(Project);
        const project = await projectRepository.findOne({
          where: { id: projectId },
          select: ["id"],
        });
        if (!project) {
          return res.status(StatusCodes.BAD_REQUEST).json(
            responseFormat(false, {
              message: `Invalid ${project} !!!`,
            })
          );
        }

        const serviceRepository = getRepository(Service);
        const isServiceExist = await serviceRepository.findOne({
          where: { id: serviceId },
        });
        if (!isServiceExist) {
          return res.status(StatusCodes.BAD_REQUEST).json(
            responseFormat(false, {
              message: `${name} already exists, Please enter another name !!!`,
            })
          );
        }

        const newService: Service = serviceRepository.create({
          name: isServiceExist.name,
          price: isServiceExist.price,
          inProject: project,
        });
        await serviceRepository.save(newService);

        const responseData = {
          id: newService.id,
          name: newService.name,
          sumData: newService.sumData,
          sumCost: newService.sumCost,
          unpaid: newService.unpaid,
          inProject: newService.inProject,
        };

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
            responseData
          )
        );
      } else {
        return res.status(StatusCodes.BAD_REQUEST).json(
          responseFormat(false, {
            message: "Invalid service!!!",
          })
        );
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error",
      });
    }
  }

  //[GET] /
  static async readServices(req: Request, res: Response, next: NextFunction) {
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

      const serviceRepository = getRepository(Service);

      const services = await serviceRepository.find({
        where: {
          inProject: IsNull(),
        },
        select: ["name", "introduction", "information", "price"],
      });

      if (!services) {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(
          responseFormat(false, {
            message: "Can not find any services!!!",
          })
        );
      }

      return res.status(StatusCodes.OK).json(
        responseFormat(
          true,
          {
            message: "Find service successfully!!!",
          },
          services
        )
      );
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error",
      });
    }
  }

  //[PATCH] /:id
  static async editServiceByUser(
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

      const payload: EditServiceByUserSchema = req.body;
      const projectId: string | undefined = req.params?.projectId;
      const serviceId: string | undefined = req.params?.serviceId;

      if (projectId && serviceId && payload.content) {
        const projectRepository = getRepository(Project);
        const project = await projectRepository.findOne({
          where: { id: projectId },
          select: ["id"],
        });
        if (!project) {
          return res.status(StatusCodes.BAD_REQUEST).json(
            responseFormat(false, {
              message: `Invalid ${project} !!!`,
            })
          );
        }

        const serviceRepository = getRepository(Service);
        console.log("serviceId: <<>> <<< <<< ", serviceId);
        const service = await serviceRepository.findOne({
          where: { id: serviceId, inProject: project },
        });
        if (!service) {
          return res.status(StatusCodes.BAD_REQUEST).json(
            responseFormat(false, {
              message: `${name} already exists, Please enter another name !!!`,
            })
          );
        }

        const newData: number = service.sumData + 1;
        const sumCost: number = newData * service.price;

        const newServicePayload = {
          name: service.name,
          sumData: newData,
          sumCost,
        };
        const isServiceUpdated = await serviceRepository.update(
          service.id,
          newServicePayload
        );
        if (!isServiceUpdated) {
          return res.status(StatusCodes.NOT_FOUND).json(
            responseFormat(false, {
              message: `No information found for ${newServicePayload}`,
            })
          );
        }
        const serviceAfterUpdate = await serviceRepository.findOne({
          where: { id: service.id },
        });

        const historyRepository = getRepository(History);

        const cost: number = service.price;

        const newHistoryService = {
          name: service.name,
          content: payload.content,
          cost,
          inService: service,
          inProject: project,
        };

        const newHistory: History = historyRepository.create(newHistoryService);
        await historyRepository.save(newHistory);

        if (!newHistory) {
          return res.status(StatusCodes.NOT_FOUND).json(
            responseFormat(false, {
              message: `No information found for ${newHistoryService.name}`,
            })
          );
        }

        return res.status(StatusCodes.OK).json(
          responseFormat(
            true,
            {
              message: "The data has been updated !!!",
            },
            {
              service: serviceAfterUpdate,
              history: newHistory,
            }
          )
        );
      } else {
        return res.status(StatusCodes.BAD_REQUEST).json(
          responseFormat(false, {
            message: "Invalid request body",
          })
        );
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error",
      });
    }
  }

  //[PATCH]
  static async activateService(
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId: string | undefined = req.user?.id;
      const { serviceId, projectId } = req.body;

      if (userId && serviceId && projectId) {
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
          select: ["id"],
        });

        if (!project) {
          return res.status(StatusCodes.NOT_FOUND).json(
            responseFormat(false, {
              message: "Can not find project_id !!!",
            })
          );
        }

        const serviceRepository = getRepository(Service);
        const service = await serviceRepository.findOne({
          where: { id: serviceId, inProject: project },
        });
        if (!service) {
          return res.status(StatusCodes.BAD_REQUEST).json(
            responseFormat(false, {
              message: `Invalid ${service} !!!`,
            })
          );
        }

        service.isActed = true;
        const isActivated = await serviceRepository.save(service);

        if (!isActivated) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Service has not been activated yet !!!",
          });
        }

        return res.status(StatusCodes.OK).json(
          responseFormat(true, {
            message: "Service has been activated !!!",
          })
        );
      } else {
        return res.status(StatusCodes.BAD_REQUEST).json(
          responseFormat(false, {
            message: "Bad request body, please enter valid data!!!",
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

  //[PATCH]
  static async deactivateService(
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId: string | undefined = req.user?.id;
      const { serviceId, projectId } = req.body;

      if (userId && serviceId && projectId) {
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
          select: ["id"],
        });

        if (!project) {
          return res.status(StatusCodes.NOT_FOUND).json(
            responseFormat(false, {
              message: "Can not find project_id !!!",
            })
          );
        }

        const serviceRepository = getRepository(Service);
        const service = await serviceRepository.findOne({
          where: { id: serviceId, inProject: project },
        });
        if (!service) {
          return res.status(StatusCodes.BAD_REQUEST).json(
            responseFormat(false, {
              message: `Invalid ${service} !!!`,
            })
          );
        }

        service.isActed = false;
        const isDeactivated = await serviceRepository.save(service);

        if (!isDeactivated) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Service has not been deactivated yet !!!",
          });
        }

        return res.status(StatusCodes.OK).json(
          responseFormat(true, {
            message: "Service has been deactivated !!!",
          })
        );
      } else {
        return res.status(StatusCodes.BAD_REQUEST).json(
          responseFormat(false, {
            message: "Bad request body, please enter valid data!!!",
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
}

export default ServiceController;
