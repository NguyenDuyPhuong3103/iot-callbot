import {
  Entity,
  Column,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  AfterLoad,
  BeforeInsert,
} from "typeorm";

import { Exclude } from "class-transformer";

import { Project } from "./project";

import bcrypt from "bcryptjs";
import crypto from "crypto";

export enum RoleEnumType {
  USER = "user",
  ADMIN = "admin",
  PUBLIC = "anonymous",
}

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  avatar!: string;

  @Index("email_index")
  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ default: false })
  isLocked!: boolean;

  @Column({ default: false })
  isConfirmed!: boolean;

  @Column({ default: null, nullable: true })
  refreshToken!: string;

  @Column({
    type: "enum",
    enum: RoleEnumType,
    default: RoleEnumType.USER,
  })
  role!: RoleEnumType.USER;

  @Column({ type: "varchar", nullable: true })
  passwordResetToken!: string | undefined;

  @Column({ type: "timestamp", nullable: true })
  passwordResetExpires!: Date | undefined;

  @Column({ type: "timestamp", nullable: true })
  passwordChangeAt!: Date | undefined;

  @Exclude()
  tempPassword: string = "";

  @OneToMany((_type) => Project, (project: Project) => project.createdBy, {
    cascade: true,
  })
  projects!: Project[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  toJSON() {
    return {
      ...this,
      password: undefined,
      role: undefined,
      refreshToken: undefined,
      isConfirmed: undefined,
      tempPassword: undefined,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
      passwordChangeAt: undefined,
    };
  }

  // ? Hash password before saving to database
  // private tempPassword: string = "";
  @AfterLoad()
  storeOriginalPassword() {
    this.tempPassword = this.password;
  }

  @BeforeInsert()
  public async hashPassword() {
    if (this.password && this.password !== this.tempPassword) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  // ? Validate password
  async comparePasswords(password: string) {
    try {
      return await bcrypt.compare(password, this.password);
    } catch (error) {
      console.log(error);
    }
  }

  // create password change token
  async createPasswordChangedToken() {
    try {
      const resetToken: string = crypto.randomBytes(32).toString("hex");
      this.passwordResetToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
      this.passwordResetExpires = new Date(
        new Date().getTime() + 15 * 60 * 1000
      ); //Current time plus 15 minutes
      return resetToken;
    } catch (error) {
      console.log(error);
    }
  }
}
