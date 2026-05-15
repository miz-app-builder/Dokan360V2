import type { LeaveStatus } from "@workspace/db";

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export type LeaveTypeDto = {
  id:           number;
  shopId:       number | null;
  name:         string;
  nameBn:       string;
  defaultDays:  number;
  isPaid:       boolean;
  color:        string;
  isActive:     boolean;
  isDefault:    boolean;
  isOverridden: boolean;
  createdAt:    string;
  updatedAt:    string;
};

export type LeaveRequestDto = {
  id:               number;
  shopId:           number;
  employeeId:       number;
  employeeName:     string;
  employeeCode:     string | null;
  leaveTypeId:      number;
  leaveTypeName:    string;
  leaveTypeNameBn:  string;
  leaveTypeColor:   string;
  fromDate:         string;
  toDate:           string;
  days:             number;
  reason:           string | null;
  status:           LeaveStatus;
  approvedByName:   string | null;
  approvedAt:       string | null;
  rejectedReason:   string | null;
  createdAt:        string;
  updatedAt:        string;
};

export type LeaveBalanceDto = {
  employeeId:       number;
  employeeName:     string;
  employeeCode:     string | null;
  leaveTypeId:      number;
  leaveTypeName:    string;
  leaveTypeNameBn:  string;
  leaveTypeColor:   string;
  year:             number;
  totalDays:        number;
  usedDays:         number;
  remainingDays:    number;
};

export type ListRequestsOpts = {
  employeeId?: number;
  status?:     LeaveStatus;
  from?:       string;
  to?:         string;
  year?:       number;
  page:        number;
  limit:       number;
};

export type PaginatedLeaveRequests = {
  data:  LeaveRequestDto[];
  total: number;
  page:  number;
  limit: number;
};
