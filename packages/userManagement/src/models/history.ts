import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";

import { Service } from "./service";
import { Project } from "./project";

@Entity()
export class History {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  content!: string;

  @Column()
  cost!: number;

  @ManyToOne((_type) => Service, (service: Service) => service.historys)
  @JoinColumn({ name: "inService" })
  inService!: Service;

  @ManyToOne((_type) => Project, (project: Project) => project.historys)
  @JoinColumn({ name: "inProject" })
  inProject!: Project;

  @CreateDateColumn()
  createdAt!: Date;
}
