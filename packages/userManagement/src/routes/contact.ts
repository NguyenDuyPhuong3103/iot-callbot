import { isAdmin } from "../middleware/authorization";
import express from "express";
const router = express.Router();

import ContactController from "../controllers/contact";
import {
  RequestWithUser,
  verifyUserAccessToken,
} from "../middleware/jwtServices";

router.get("/", ContactController.readContacts);
router.use(verifyUserAccessToken, isAdmin);
router.post("/createContact", ContactController.createContact);
// router.patch("/:id", ContactController.editContact);
// router.delete("/:id", ContactController.deleteContact);

export default router;
