import "reflect-metadata";
import express, { Application } from "express";
import { createConnection } from "typeorm";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import Router from "./routes";
import dbConfig from "./config/database";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import fs from "fs";
import path from "path";
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const file = fs.readFileSync(path.resolve("swagger.yaml"), "utf8");
const swaggerDocument = YAML.parse(file);

const PORT = process.env.PORT || 8000;

const app: Application = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(express.static("public"));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api", Router);

createConnection(dbConfig)
  .then((_connection) => {
    app.listen(PORT, () => {
      console.log("Server is running on port", PORT);
    });
  })
  .catch((err) => {
    console.log("Unable to connect to db", err);
    process.exit(1);
  });
