import { db, payrollRecordsTable, employeesTable, attendanceTable, leaveRequestsTable, leaveTypesTable, salaryGradesTable } from "@workspace/db";
import { eq, and, desc, inArray, gte, lte } from "drizzle-orm";
import { NotFoundError, ValidationError } from "../../common/errors";

// ─── Types ────────────────────────────────────────────────────────────────────

type PayrollRecordDto = {
  id:                    number;
  shopId:                number;
  employeeId:            number;
  employeeName:          string;
  employeeCode:          string | null;
  month:                 number;
  year:                  number;
  baseSalary:            number;
  workingDays:           number;
  presentDays:           number;
  absentDays:            number;
  lateMinutes:           number;
  overtimeMinutes:       number;
  houseRentAllowance:    number;
  medicalAllowance:      number;
  transportAllowance:    number;
  foodAllowance:         number;
  commission:            number;
  overtimePay:           number;
  bonus:                 number;
  advance:               number;
  otherDeductions:       number;
  unpaidLeaveDays:       number;
  unpaidLeaveDeduction:  number;
  providentFundEmployee: number;
  providentFundEmployer: number;
  taxDeduction:          number;
  loanDeduction:         number;
  grossSalary:           number;
  netSalary:             number;
  paymentStatus:         "unpaid" | "paid";
  paidAt:                string | null;
  note:                  string | null;
  createdAt:             string;
  updatedAt:             string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function workingDaysInMonth(year: number, month: number): number {
  const lastDay = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= lastDay; d++) {
    const day = new Date(year, month - 1, d).getDay();
    if (day !== 5 && day !== 6) count++; // Friday=5, Saturday=6 (Bangladesh weekend)
  }
  return count;
}

function buildDto(
  row: typeof payrollRecordsTable.$inferSelect,
  employeeName: string,
  employeeCode: string | null,
): PayrollRecordDto {
  return {
    id:                    row.id,
    shopId:                row.shopId,
    employeeId:            row.employeeId,
    employeeName,
    employeeCode,
    month:                 row.month,
    year:                  row.year,
    baseSalary:            Number(row.baseSalary),
    workingDays:           row.workingDays,
    presentDays:           row.presentDays,
    absentDays:            row.absentDays,
    lateMinutes:           row.lateMinutes,
    overtimeMinutes:       row.overtimeMinutes,
    houseRentAllowance:    Number(row.houseRentAllowance),
    medicalAllowance:      Number(row.medicalAllowance),
    transportAllowance:    Number(row.transportAllowance),
    foodAllowance:         Number(row.foodAllowance),
    commission:            Number(row.commission),
    overtimePay:           Number(row.overtimePay),
    bonus:                 Number(row.bonus),
    advance:               Number(row.advance),
    otherDeductions:       Number(row.otherDeductions),
    unpaidLeaveDays:       row.unpaidLeaveDays,
    unpaidLeaveDeduction:  Number(row.unpaidLeaveDeduction),
    providentFundEmployee: Number(row.providentFundEmployee),
    providentFundEmployer: Number(row.providentFundEmployer),
    taxDeduction:          Number(row.taxDeduction),
    loanDeduction:         Number(row.loanDeduction),
    grossSalary:           Number(row.grossSalary),
    netSalary:             Number(row.netSalary),
    paymentStatus:         row.paymentStatus,
    paidAt:                row.paidAt ? row.paidAt.toISOString() : null,
    note:                  row.note,
    createdAt:             row.createdAt.toISOString(),
    updatedAt:             row.updatedAt.toISOString(),
  };
}

function calcTotals(opts: {
  baseSalary:            number;
  workingDays:           number;
  presentDays:           number;
  houseRentAllowance:    number;
  medicalAllowance:      number;
  transportAllowance:    number;
  foodAllowance:         number;
  commission:            number;
  overtimePay:           number;
  bonus:                 number;
  advance:               number;
  otherDeductions:       number;
  unpaidLeaveDeduction:  number;
  providentFundEmployee: number;
  taxDeduction:          number;
  loanDeduction:         number;
}): { grossSalary: number; netSalary: number; earnedBaseSalary: number } {
  // Pro-rata base salary: only pay for days actually present + paid-leave days
  // unpaidLeaveDeduction already covers approved-unpaid-leave days
  // Any remaining absent days are implicitly covered by pro-rata
  const earnedBaseSalary =
    opts.workingDays > 0
      ? Math.round((opts.baseSalary / opts.workingDays) * opts.presentDays * 100) / 100
      : opts.baseSalary;

  const grossSalary =
    earnedBaseSalary +
    opts.houseRentAllowance +
    opts.medicalAllowance +
    opts.transportAllowance +
    opts.foodAllowance +
    opts.commission +
    opts.overtimePay +
    opts.bonus;

  const netSalary = Math.max(
    0,
    grossSalary -
      opts.advance -
      opts.otherDeductions -
      opts.unpaidLeaveDeduction -
      opts.providentFundEmployee -
      opts.taxDeduction -
      opts.loanDeduction,
  );

  return { grossSalary, netSalary, earnedBaseSalary };
}

// ─── listPayroll ──────────────────────────────────────────────────────────────

export async function listPayroll(
  shopId: number,
  opts: { month: number; year: number; employeeId?: number; paymentStatus?: "unpaid" | "paid" },
): Promise<PayrollRecordDto[]> {
  const conditions = [
    eq(payrollRecordsTable.shopId, shopId),
    eq(payrollRecordsTable.month, opts.month),
    eq(payrollRecordsTable.year, opts.year),
  ];
  if (opts.employeeId)    conditions.push(eq(payrollRecordsTable.employeeId, opts.employeeId));
  if (opts.paymentStatus) conditions.push(eq(payrollRecordsTable.paymentStatus, opts.paymentStatus));

  const rows = await db
    .select({
      record:       payrollRecordsTable,
      employeeName: employeesTable.name,
      employeeCode: employeesTable.employeeCode,
    })
    .from(payrollRecordsTable)
    .innerJoin(employeesTable, eq(payrollRecordsTable.employeeId, employeesTable.id))
    .where(and(...conditions))
    .orderBy(employeesTable.name);

  return rows.map((r) => buildDto(r.record, r.employeeName, r.employeeCode ?? null));
}

// ─── getPayrollStats ──────────────────────────────────────────────────────────

export async function getPayrollStats(shopId: number, month: number, year: number) {
  const rows = await db
    .select({
      paymentStatus: payrollRecordsTable.paymentStatus,
      netSalary:     payrollRecordsTable.netSalary,
      grossSalary:   payrollRecordsTable.grossSalary,
    })
    .from(payrollRecordsTable)
    .where(
      and(
        eq(payrollRecordsTable.shopId, shopId),
        eq(payrollRecordsTable.month, month),
        eq(payrollRecordsTable.year, year),
      ),
    );

  let totalGross = 0, totalNet = 0, totalPaid = 0, totalUnpaid = 0;
  let paidCount = 0, unpaidCount = 0;

  for (const r of rows) {
    const net   = Number(r.netSalary);
    const gross = Number(r.grossSalary);
    totalGross += gross;
    totalNet   += net;
    if (r.paymentStatus === "paid") { totalPaid += net; paidCount++; }
    else                            { totalUnpaid += net; unpaidCount++; }
  }

  return { month, year, totalEmployees: rows.length, totalGross, totalNet, totalPaid, totalUnpaid, paidCount, unpaidCount };
}

// ─── generatePayroll ──────────────────────────────────────────────────────────

export async function generatePayroll(
  shopId:                 number,
  month:                  number,
  year:                   number,
  overtimeRatePerMinute?: number,
): Promise<{ generated: number; skipped: number; records: PayrollRecordDto[] }> {
  const dateFrom = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay  = new Date(year, month, 0).getDate();
  const dateTo   = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const employees = await db
    .select()
    .from(employeesTable)
    .where(and(eq(employeesTable.shopId, shopId), eq(employeesTable.status, "active")));

  if (employees.length === 0) return { generated: 0, skipped: 0, records: [] };

  const employeeIds = employees.map((e) => e.id);

  const existing = await db
    .select({ employeeId: payrollRecordsTable.employeeId })
    .from(payrollRecordsTable)
    .where(
      and(
        eq(payrollRecordsTable.shopId, shopId),
        eq(payrollRecordsTable.month, month),
        eq(payrollRecordsTable.year, year),
        inArray(payrollRecordsTable.employeeId, employeeIds),
      ),
    );
  const existingIds = new Set(existing.map((r) => r.employeeId));

  const attendanceRows = await db
    .select()
    .from(attendanceTable)
    .where(
      and(
        eq(attendanceTable.shopId, shopId),
        gte(attendanceTable.date, dateFrom),
        lte(attendanceTable.date, dateTo),
        inArray(attendanceTable.employeeId, employeeIds),
      ),
    );

  const unpaidLeaveRows = await db
    .select({
      employeeId: leaveRequestsTable.employeeId,
      days:       leaveRequestsTable.days,
      isPaid:     leaveTypesTable.isPaid,
    })
    .from(leaveRequestsTable)
    .innerJoin(leaveTypesTable, eq(leaveRequestsTable.leaveTypeId, leaveTypesTable.id))
    .where(
      and(
        eq(leaveRequestsTable.shopId, shopId),
        eq(leaveRequestsTable.status, "approved"),
        gte(leaveRequestsTable.fromDate, dateFrom),
        lte(leaveRequestsTable.fromDate, dateTo),
        inArray(leaveRequestsTable.employeeId, employeeIds),
      ),
    );

  const wDays = workingDaysInMonth(year, month);

  // Pre-fetch all salary grades used by employees in one query
  const gradeIds = [...new Set(
    employees.map((e) => e.salaryGradeId).filter((id): id is number => id !== null),
  )];
  const gradesMap = new Map<number, typeof salaryGradesTable.$inferSelect>();
  if (gradeIds.length > 0) {
    const gradeRows = await db
      .select()
      .from(salaryGradesTable)
      .where(inArray(salaryGradesTable.id, gradeIds));
    for (const g of gradeRows) gradesMap.set(g.id, g);
  }

  const generated: PayrollRecordDto[] = [];
  let skipped = 0;

  for (const emp of employees) {
    if (existingIds.has(emp.id)) { skipped++; continue; }

    // ── Option 1: Full Pro-rata ──────────────────────────────────────────────
    // salary = total monthly CTC.  ALL components scale with attendance:
    //   net (excl. OT & deductions) = totalSalary × (presentDays / workingDays)
    // Grade only controls the payslip breakdown (how the earned amount is split).
    // 0 days present → ৳0.  Full month present + no OT → exactly totalSalary.
    const totalSalary = Number(emp.salary ?? 0);
    const grade       = emp.salaryGradeId !== null ? gradesMap.get(emp.salaryGradeId) : undefined;
    const round2      = (n: number) => Math.round(n * 100) / 100;

    const empAtt          = attendanceRows.filter((a) => a.employeeId === emp.id);
    const presentDays     = empAtt.filter((a) => a.status === "present" || a.status === "late" || a.status === "half_day").length;
    const absentDays      = empAtt.filter((a) => a.status === "absent").length;
    const lateMinutes     = empAtt.reduce((s, a) => s + a.lateMinutes, 0);
    const overtimeMinutes = empAtt.reduce((s, a) => s + a.overtimeMinutes, 0);

    // Proportion of month actually worked
    const proRataFactor = wDays > 0 ? presentDays / wDays : 0;

    // Grade percentages split the EARNED amount into payslip components.
    // All values stored in the record are already pro-rated.
    const basicPct = grade ? Number(grade.basicPercent) : 100;
    const baseSalary       = round2(totalSalary * basicPct / 100 * proRataFactor);
    const houseRentAllowance = grade ? round2(totalSalary * Number(grade.houseRentPercent) / 100 * proRataFactor) : 0;
    const medicalAllowance   = grade ? round2(totalSalary * Number(grade.medicalPercent)   / 100 * proRataFactor) : 0;
    const transportAllowance = grade ? round2(totalSalary * Number(grade.transportPercent) / 100 * proRataFactor) : 0;
    const foodAllowance      = grade ? round2(totalSalary * Number(grade.foodPercent)      / 100 * proRataFactor) : 0;

    // OT rate from full totalSalary (26 working days × 8 hrs × 60 min standard)
    const otRate      = overtimeRatePerMinute ?? (totalSalary > 0 ? totalSalary / (26 * 8 * 60) : 0);
    const overtimePay = round2(otRate * overtimeMinutes);

    // Unpaid leave days — tracked for HR records only.
    // Pro-rata already reduces pay for every absent day; no separate deduction needed.
    const empUnpaidLeave  = unpaidLeaveRows.filter((l) => l.employeeId === emp.id && !l.isPaid);
    const unpaidLeaveDays = empUnpaidLeave.reduce((s, l) => s + l.days, 0);

    // All components are pre-pro-rated → pass presentDays = workingDays to
    // calcTotals so it does NOT re-apply pro-rata on baseSalary.
    const { grossSalary, netSalary } = calcTotals({
      baseSalary,
      workingDays:           wDays,
      presentDays:           wDays,   // already pro-rated above; prevent double-reduction
      houseRentAllowance,
      medicalAllowance,
      transportAllowance,
      foodAllowance,
      commission:            0,
      overtimePay,
      bonus:                 0,
      advance:               0,
      otherDeductions:       0,
      unpaidLeaveDeduction:  0,       // pro-rata handles all absence; no extra deduction
      providentFundEmployee: 0,
      taxDeduction:          0,
      loanDeduction:         0,
    });

    const [row] = await db.insert(payrollRecordsTable).values({
      shopId,
      employeeId:            emp.id,
      month,
      year,
      baseSalary:            String(baseSalary),
      workingDays:           wDays,
      presentDays,
      absentDays,
      lateMinutes,
      overtimeMinutes,
      houseRentAllowance:    String(houseRentAllowance),
      medicalAllowance:      String(medicalAllowance),
      transportAllowance:    String(transportAllowance),
      foodAllowance:         String(foodAllowance),
      commission:            "0",
      overtimePay:           String(overtimePay),
      bonus:                 "0",
      advance:               "0",
      otherDeductions:       "0",
      unpaidLeaveDays,
      unpaidLeaveDeduction:  "0",
      providentFundEmployee: "0",
      providentFundEmployer: "0",
      taxDeduction:          "0",
      loanDeduction:         "0",
      grossSalary:           String(grossSalary),
      netSalary:             String(netSalary),
      paymentStatus:         "unpaid",
    }).returning();

    generated.push(buildDto(row, emp.name, emp.employeeCode ?? null));
  }

  return { generated: generated.length, skipped, records: generated };
}

// ─── getPayrollRecord ─────────────────────────────────────────────────────────

export async function getPayrollRecord(shopId: number, id: number): Promise<PayrollRecordDto> {
  const [row] = await db
    .select({ record: payrollRecordsTable, employeeName: employeesTable.name, employeeCode: employeesTable.employeeCode })
    .from(payrollRecordsTable)
    .innerJoin(employeesTable, eq(payrollRecordsTable.employeeId, employeesTable.id))
    .where(and(eq(payrollRecordsTable.id, id), eq(payrollRecordsTable.shopId, shopId)));

  if (!row) throw new NotFoundError("Payroll record not found");
  return buildDto(row.record, row.employeeName, row.employeeCode ?? null);
}

// ─── updatePayrollRecord ──────────────────────────────────────────────────────

export async function updatePayrollRecord(
  shopId: number,
  id:     number,
  data: {
    houseRentAllowance?:    number;
    medicalAllowance?:      number;
    transportAllowance?:    number;
    foodAllowance?:         number;
    commission?:            number;
    overtimePay?:           number;
    bonus?:                 number;
    advance?:               number;
    otherDeductions?:       number;
    providentFundEmployee?: number;
    providentFundEmployer?: number;
    taxDeduction?:          number;
    loanDeduction?:         number;
    note?:                  string;
  },
): Promise<PayrollRecordDto> {
  const existing = await db
    .select({ record: payrollRecordsTable, employeeName: employeesTable.name, employeeCode: employeesTable.employeeCode })
    .from(payrollRecordsTable)
    .innerJoin(employeesTable, eq(payrollRecordsTable.employeeId, employeesTable.id))
    .where(and(eq(payrollRecordsTable.id, id), eq(payrollRecordsTable.shopId, shopId)));

  if (!existing[0]) throw new NotFoundError("Payroll record not found");
  const rec = existing[0].record;

  const houseRentAllowance    = data.houseRentAllowance    !== undefined ? data.houseRentAllowance    : Number(rec.houseRentAllowance);
  const medicalAllowance      = data.medicalAllowance      !== undefined ? data.medicalAllowance      : Number(rec.medicalAllowance);
  const transportAllowance    = data.transportAllowance    !== undefined ? data.transportAllowance    : Number(rec.transportAllowance);
  const foodAllowance         = data.foodAllowance         !== undefined ? data.foodAllowance         : Number(rec.foodAllowance);
  const commission            = data.commission            !== undefined ? data.commission            : Number(rec.commission);
  const overtimePay           = data.overtimePay           !== undefined ? data.overtimePay           : Number(rec.overtimePay);
  const bonus                 = data.bonus                 !== undefined ? data.bonus                 : Number(rec.bonus);
  const advance               = data.advance               !== undefined ? data.advance               : Number(rec.advance);
  const otherDeductions       = data.otherDeductions       !== undefined ? data.otherDeductions       : Number(rec.otherDeductions);
  const providentFundEmployee = data.providentFundEmployee !== undefined ? data.providentFundEmployee : Number(rec.providentFundEmployee);
  const providentFundEmployer = data.providentFundEmployer !== undefined ? data.providentFundEmployer : Number(rec.providentFundEmployer);
  const taxDeduction          = data.taxDeduction          !== undefined ? data.taxDeduction          : Number(rec.taxDeduction);
  const loanDeduction         = data.loanDeduction         !== undefined ? data.loanDeduction         : Number(rec.loanDeduction);

  const { grossSalary, netSalary } = calcTotals({
    baseSalary:            Number(rec.baseSalary),
    workingDays:           rec.workingDays,
    presentDays:           rec.presentDays,
    houseRentAllowance,
    medicalAllowance,
    transportAllowance,
    foodAllowance,
    commission,
    overtimePay,
    bonus,
    advance,
    otherDeductions,
    unpaidLeaveDeduction:  Number(rec.unpaidLeaveDeduction),
    providentFundEmployee,
    taxDeduction,
    loanDeduction,
  });

  const updates: Record<string, unknown> = {
    houseRentAllowance:    String(houseRentAllowance),
    medicalAllowance:      String(medicalAllowance),
    transportAllowance:    String(transportAllowance),
    foodAllowance:         String(foodAllowance),
    commission:            String(commission),
    overtimePay:           String(overtimePay),
    bonus:                 String(bonus),
    advance:               String(advance),
    otherDeductions:       String(otherDeductions),
    providentFundEmployee: String(providentFundEmployee),
    providentFundEmployer: String(providentFundEmployer),
    taxDeduction:          String(taxDeduction),
    loanDeduction:         String(loanDeduction),
    grossSalary:           String(grossSalary),
    netSalary:             String(netSalary),
  };
  if (data.note !== undefined) updates["note"] = data.note;

  const [updated] = await db
    .update(payrollRecordsTable)
    .set(updates)
    .where(and(eq(payrollRecordsTable.id, id), eq(payrollRecordsTable.shopId, shopId)))
    .returning();

  return buildDto(updated, existing[0].employeeName, existing[0].employeeCode ?? null);
}

// ─── markPayrollPaid ──────────────────────────────────────────────────────────

export async function markPayrollPaid(shopId: number, id: number, note?: string): Promise<PayrollRecordDto> {
  const existing = await db
    .select({ record: payrollRecordsTable, employeeName: employeesTable.name, employeeCode: employeesTable.employeeCode })
    .from(payrollRecordsTable)
    .innerJoin(employeesTable, eq(payrollRecordsTable.employeeId, employeesTable.id))
    .where(and(eq(payrollRecordsTable.id, id), eq(payrollRecordsTable.shopId, shopId)));

  if (!existing[0]) throw new NotFoundError("Payroll record not found");
  if (existing[0].record.paymentStatus === "paid") throw new ValidationError("Already marked as paid");

  const updates: Record<string, unknown> = { paymentStatus: "paid", paidAt: new Date() };
  if (note) updates["note"] = note;

  const [updated] = await db
    .update(payrollRecordsTable)
    .set(updates)
    .where(and(eq(payrollRecordsTable.id, id), eq(payrollRecordsTable.shopId, shopId)))
    .returning();

  return buildDto(updated, existing[0].employeeName, existing[0].employeeCode ?? null);
}

// ─── deletePayrollRecord ──────────────────────────────────────────────────────

export async function deletePayrollRecord(shopId: number, id: number): Promise<void> {
  const rows = await db
    .delete(payrollRecordsTable)
    .where(and(eq(payrollRecordsTable.id, id), eq(payrollRecordsTable.shopId, shopId)))
    .returning();
  if (rows.length === 0) throw new NotFoundError("Payroll record not found");
}

// ─── getEmployeePayrollHistory ────────────────────────────────────────────────

export async function getEmployeePayrollHistory(shopId: number, employeeId: number, limit = 24): Promise<PayrollRecordDto[]> {
  const emp = await db
    .select({ name: employeesTable.name, employeeCode: employeesTable.employeeCode })
    .from(employeesTable)
    .where(and(eq(employeesTable.id, employeeId), eq(employeesTable.shopId, shopId)));

  if (!emp[0]) throw new NotFoundError("Employee not found");

  const rows = await db
    .select()
    .from(payrollRecordsTable)
    .where(and(eq(payrollRecordsTable.shopId, shopId), eq(payrollRecordsTable.employeeId, employeeId)))
    .orderBy(desc(payrollRecordsTable.year), desc(payrollRecordsTable.month))
    .limit(limit);

  return rows.map((r) => buildDto(r, emp[0].name, emp[0].employeeCode ?? null));
}
