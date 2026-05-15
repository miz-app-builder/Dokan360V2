import { pgTable, pgEnum, text, serial, integer, numeric, date, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { shopsTable } from "./shops";
import { usersTable } from "./users";
import { salaryGradesTable } from "./salary-grades";

export const employeeStatusEnum = pgEnum("employee_status", ["active", "inactive", "suspended", "resigned"]);
export const employeeGenderEnum = pgEnum("employee_gender", ["male", "female", "other"]);
export const employeeBloodGroupEnum = pgEnum("employee_blood_group", ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]);

export const employeesTable = pgTable("employees", {
  id:               serial("id").primaryKey(),
  shopId:           integer("shop_id").references(() => shopsTable.id).notNull(),
  userId:           integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  employeeCode:     text("employee_code"),
  name:             text("name").notNull(),
  fatherName:       text("father_name"),
  motherName:       text("mother_name"),
  phone:            text("phone"),
  emergencyContact: text("emergency_contact"),
  email:            text("email"),
  address:          text("address"),
  nidNumber:        text("nid_number"),
  dateOfBirth:      date("date_of_birth"),
  gender:           employeeGenderEnum("gender"),
  joiningDate:      date("joining_date"),
  bloodGroup:       employeeBloodGroupEnum("blood_group"),
  salary:           numeric("salary", { precision: 12, scale: 2 }),
  salaryGradeId:    integer("salary_grade_id").references(() => salaryGradesTable.id, { onDelete: "set null" }),
  status:           employeeStatusEnum("status").notNull().default("active"),
  department:       text("department"),
  designation:      text("designation"),
  photo:            text("photo"),
  nidDocPath:       text("nid_doc_url"),
  cvPath:           text("cv_url"),
  contractPath:     text("contract_url"),
  notes:            text("notes"),
  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertEmployeeSchema = createInsertSchema(employeesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employeesTable.$inferSelect;
export type EmployeeStatus = typeof employeeStatusEnum.enumValues[number];
export type EmployeeGender = typeof employeeGenderEnum.enumValues[number];
export type EmployeeBloodGroup = typeof employeeBloodGroupEnum.enumValues[number];
