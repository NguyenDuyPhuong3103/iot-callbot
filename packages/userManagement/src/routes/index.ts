import { Project } from "./../models/project";
import express from "express";
import UserRouter from "./user";
import AdminRouter from "./admin";
import ServiceRouter from "./service";
import ProjectRouter from "./project";
import ContactRouter from "./contact";
import DocumentationRouter from "./documentation";
import { notFound } from "../middleware/notFound";

const router = express.Router();

router.use("/user", UserRouter);
router.use("/admin", AdminRouter);
router.use("/service", ServiceRouter);
router.use("/project", ProjectRouter);
router.use("/contact", ContactRouter);
router.use("/documentation", DocumentationRouter);

router.use(notFound);

export default router;
