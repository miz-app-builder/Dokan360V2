// Re-exports all leave service functions from their dedicated modules.
// Router imports from here — keeping the public API stable.

export type {
  LeaveTypeDto,
  LeaveRequestDto,
  LeaveBalanceDto,
  ListRequestsOpts,
  PaginatedLeaveRequests,
} from "./leaves.types";

export {
  listLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
} from "./leaves-types.service";

export {
  listLeaveRequests,
  createLeaveRequest,
  updateLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  deleteLeaveRequest,
} from "./leaves-requests.service";

export { listLeaveBalances } from "./leaves-balances.service";
