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

import { Project } from "./project";
import { History } from "./history";

@Entity()
export class Service {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  introduction!: string;

  @Column({ nullable: true })
  information!: string;

  @Column()
  price!: number;

  @Column({ default: 0 })
  sumData!: number;

  @Column({ default: 0 })
  sumCost!: number;

  @Column({ nullable: true })
  unpaid!: number;

  @Column({ default: false })
  isActed!: boolean;

  @ManyToOne((_type) => Project, (project: Project) => project.services, {
    nullable: true,
  })
  @JoinColumn({ name: "inProject" })
  inProject!: Project;

  @OneToMany((_type) => History, (history: History) => history.inService, {
    cascade: true,
  })
  historys!: History[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
