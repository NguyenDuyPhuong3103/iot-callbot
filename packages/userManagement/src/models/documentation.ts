import { Service } from "./service";
import {
  Entity,
  Column,
  OneToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class Documentation {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  overview!: string;

  @Column()
  services!: string;

  @Column()
  pricingPolicies!: string;

  @Column()
  privacyPolicies!: string;

  @Column()
  termOfServices!: string;

  @Column()
  FAQs!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
