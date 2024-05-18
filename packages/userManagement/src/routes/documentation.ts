import { isAdmin } from "../middleware/authorization";
import express from "express";
const router = express.Router();

import DocumentationController from "../controllers/documentation";
import {
  RequestWithUser,
  verifyUserAccessToken,
} from "../middleware/jwtServices";

router.get("/", DocumentationController.readDocumentations);
router.use(verifyUserAccessToken, isAdmin);
router.post("/", DocumentationController.createDocumentation);
router.patch("/:id", DocumentationController.editDocumentation);

export default router;
