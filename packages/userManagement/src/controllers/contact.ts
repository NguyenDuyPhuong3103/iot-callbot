import { getRepository, DeepPartial } from "typeorm";
import { Request, Response, NextFunction } from "express";
import { Contact } from "../models";
import { CreateContactSchema } from "../schemas/contact";
import { StatusCodes } from "http-status-codes";
import { responseFormat } from "../utils/responseFormat";
import { validationResult } from "express-validator";

class ContactController {

  //[GET] /
  static async readContacts(req: Request, res: Response, next: NextFunction) {
    try {
      const page: number = Number(req.query.page) || 1;
      const limit: number = Number(req.query.limit) || 7;
      const { searchText } = req.query;

      const offset: number = (page - 1) * limit;

      const contactRepository = getRepository(Contact);

      let query = contactRepository
        .createQueryBuilder("contact")
        .select([
          "contact.id",
          "contact.fullName",
          "contact.email",
          "contact.phoneNumber",
          "contact.company",
          "contact.yourMessage",
        ])
        .offset(offset)
        .limit(limit);

      if (searchText) {
        query = query
          .where("contact.yourMessage LIKE :searchText", {
            searchText: `%${searchText}%`,
          })
          .orWhere("contact.fullName LIKE :searchText", {
            searchText: `%${searchText}%`,
          })
      }

      const contacts: Contact[] = await query.getMany();

      return res.status(StatusCodes.OK).json(
        responseFormat(
          true,
          {
            message: "Get data successfully !!!",
          },
          contacts
        )
      );
    } catch (error) {
      console.error("Error fetching contacts:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error",
      });
    }
  }

  //[POST] /
  static async createContact(req: Request, res: Response, next: NextFunction) {
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

      const payload: CreateContactSchema = req.body;

      const contactRepository = getRepository(Contact);

      const newContact: Contact = contactRepository.create(payload);
      await contactRepository.save(newContact);

      if (!newContact) {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(
          responseFormat(false, {
            message: "contact registration failed!!!",
          })
        );
      }

      return res.status(StatusCodes.OK).json(
        responseFormat(true, {
          message: "contact registration successfully!!!",
        })
      );

    } catch (error) {
      console.error("Error fetching contacts:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error",
      });
    }
  }

  //[PUT] /
  static async editContact(req: Request, res: Response, next: NextFunction) {
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

      const contactId: string | undefined = req.params?.id;

      const payload: CreateContactSchema = req.body;

      const contactRepository = getRepository(Contact);

      if (contactId) {
        const isContactUpdated = await contactRepository.update(contactId, payload);
        if (!isContactUpdated) {
          return res.status(StatusCodes.NOT_FOUND).json(
            responseFormat(false, {
              message: `No information found for ${payload}`,
            })
          );
        }

        const contactAfterUpdate = await contactRepository.findOne({
          where: { id: contactId },
        });

        return res.status(StatusCodes.OK).json(
          responseFormat(
            true,
            {
              message: "The data has been updated !!!",
            },
            contactAfterUpdate
          )
        );
      } else {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
          responseFormat(false, {
            message: "contact_Id does not exist !!!",
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

  //[DELETE] /:id
  static async deleteContact(req: Request, res: Response) {
    try {
      const contactRepository = getRepository(Contact);

      const contactId: string = req.params?.id;

      const contact: Contact | null = await contactRepository.findOne({
        where: { id: contactId },
      });
      if (!contact) {
        return res.status(StatusCodes.BAD_REQUEST).json(
          responseFormat(false, {
            message: `Invalid ${contact} !!!`,
          })
        );
      }

      const isContactDeleted = await contactRepository.delete(contactId);

      if (!isContactDeleted) {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(
          responseFormat(false, {
            message: "Contact deletion failed !!!",
          })
        );
      }

      return res.status(StatusCodes.OK).json(
        responseFormat(true, {
          message: "Delete Contact successfully !!!",
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
}

export default ContactController;