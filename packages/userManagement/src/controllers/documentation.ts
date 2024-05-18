import { getRepository, DeepPartial } from "typeorm";
import { Request, Response, NextFunction } from "express";
import { Documentation } from "../models";
import { CreateDocumentationSchema } from "../schemas/documentation";
import { StatusCodes } from "http-status-codes";
import { responseFormat } from "../utils/responseFormat";
import { validationResult } from "express-validator";

class DocumentationController {

  //[GET] /
  static async readDocumentations(req: Request, res: Response, next: NextFunction) {
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

      const documentationRepository = getRepository(Documentation);

      const documentations = await documentationRepository.find();
      if (!documentations) {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(
          responseFormat(false, {
            message: "Can not find any documentations!!!",
          })
        );
      }

      return res.status(StatusCodes.OK).json(
        responseFormat(true, {
          message: "Find service successfully!!!",
        }, documentations)
      );

    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error",
      });
    }
  }

  //[POST] /
  static async createDocumentation(req: Request, res: Response, next: NextFunction) {
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

      const payload: CreateDocumentationSchema = req.body;

      const documentationRepository = getRepository(Documentation);

      const newDocumentation: Documentation = documentationRepository.create(payload);
      await documentationRepository.save(newDocumentation);

      if (!newDocumentation) {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(
          responseFormat(false, {
            message: "Documentation registration failed!!!",
          })
        );
      }

      return res.status(StatusCodes.OK).json(
        responseFormat(true, {
          message: "Documentation registration successfully!!!",
        })
      );

    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error",
      });
    }
  }

  //[PUT] /
  static async editDocumentation(req: Request, res: Response, next: NextFunction) {
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

      const documentationId: string | undefined = req.params?.id;

      const payload: CreateDocumentationSchema = req.body;

      const documentationRepository = getRepository(Documentation);

      if (documentationId) {
        const isDOcumentationUpdated = await documentationRepository.update(documentationId, payload);
        if (!isDOcumentationUpdated) {
          return res.status(StatusCodes.NOT_FOUND).json(
            responseFormat(false, {
              message: `No information found for ${payload}`,
            })
          );
        }

        const documentationAfterUpdate = await documentationRepository.findOne({
          where: { id: documentationId },
        });

        return res.status(StatusCodes.OK).json(
          responseFormat(
            true,
            {
              message: "The data has been updated !!!",
            },
            documentationAfterUpdate
          )
        );
      } else {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
          responseFormat(false, {
            message: "Service_Id does not exist !!!",
          })
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
}

export default DocumentationController;