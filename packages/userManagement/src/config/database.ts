import { ConnectionOptions } from "typeorm";
import { User, Project, Service, Documentation, Contact } from "../models";
import { History } from "../models/history";

const config: ConnectionOptions = {
  type: "postgres",
  host: process.env.POSTGRES_HOST || "localhost",
  port: Number(process.env.POSTGRES_PORT) || 5432,
  username: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "postgres",
  database: process.env.POSTGRES_DB || "postgres",
  entities: [User, Project, Service, Documentation, Contact, History],
  synchronize: true,
};

export default config;
