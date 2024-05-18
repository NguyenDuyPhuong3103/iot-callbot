import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";

import { User } from "./user";
import { Service } from "./service";
import { History } from "./history";

@Entity()
export class Project {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ default: null, nullable: true })
  refreshProjectToken!: string;

  @ManyToOne((_type) => User, (user: User) => user.projects)
  @JoinColumn({ name: "createdBy" })
  createdBy!: User;

  @OneToMany((_type) => Service, (service: Service) => service.inProject, {
    cascade: true,
  })
  services!: Service[];

  @OneToMany((_type) => History, (history: History) => history.inProject, {
    cascade: true,
  })
  historys!: History[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
