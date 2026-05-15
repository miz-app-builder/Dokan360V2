import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { AdjustInventoryBody, AnalyticsPeriodPoint, ApproveLeaveRequestBody, AttendanceListResponse, AttendanceRecord, AttendanceReportResponse, AuditLogsResponse, AuthResponse, CalendarScheduleResponse, Category, CheckInRequest, CheckOutRequest, CollectPaymentBody, CreateAttendanceRequest, CreateCategoryBody, CreateCustomRoleBody, CreateCustomerBody, CreateLeaveRequestBody, CreateLeaveTypeRequest, CreateProductBody, CreatePurchaseBody, CreateSalaryGradeBody, CreateSaleBody, CreateScheduleRequest, CreateShiftRequest, CreateSupplierBody, CustomRoleItem, Customer, DashboardSummary, DeleteSchedule200, DeleteShift200, DueReport, DutySchedule, ErrorResponse, GeneratePayroll201, GeneratePayrollBody, GetAttendanceReportParams, GetAuditLogsParams, GetCalendarScheduleParams, GetDashboardAnalyticsParams, GetEmployeePayrollHistoryParams, GetPayrollStatsParams, GetProductReportParams, GetProfitReportParams, GetSalesReportParams, GetStaffReportParams, HealthStatus, HeatmapPoint, InventoryAdjustment, InventoryItem, InventoryReport, InviteUserBody, LeaveBalance, LeaveRequest, LeaveRequestListResponse, LeaveType, LedgerEntry, ListAttendanceParams, ListCustomersParams, ListLeaveBalancesParams, ListLeaveRequestsParams, ListPayrollParams, ListProductsParams, ListSalesParams, ListSchedulesParams, ListSuppliersParams, LoginBody, LogoutBody, MarkAllNotificationsRead200, MarkPayrollPaidBody, Notification, NotificationCount, OkResponse, PayPurchaseDueBody, PayrollRecord, PayrollStats, Product, ProductReport, ProfitReport, Purchase, PurchaseDetail, PurchaseStats, RefreshBody, RefreshResponse, RegisterBody, RegisterPendingResponse, RejectLeaveRequestBody, RolePermissionsResponse, SalaryGrade, Sale, SaleDetail, SalesChartPoint, SalesReport, Shift, ShopInfo, ShopUser, StaffReport, Supplier, SupplierStats, TodayAttendanceResponse, TopProduct, UpdateAttendanceRequest, UpdateCustomerBody, UpdateLeaveRequestBody, UpdateLeaveTypeRequest, UpdatePayrollRecordBody, UpdateProductBody, UpdateRolePermissionsBody, UpdateSalaryGradeBody, UpdateScheduleRequest, UpdateShiftRequest, UpdateShopBody, UpdateSupplierBody, UpdateUserAccessRequest, UpdateUserBody, User, UserAccessDetail, UserAccessListResponse, WeeklyScheduleResponse } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Login user
 */
export declare const getLoginUrl: () => string;
export declare const login: (loginBody: LoginBody, options?: RequestInit) => Promise<AuthResponse>;
export declare const getLoginMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
        data: BodyType<LoginBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
    data: BodyType<LoginBody>;
}, TContext>;
export type LoginMutationResult = NonNullable<Awaited<ReturnType<typeof login>>>;
export type LoginMutationBody = BodyType<LoginBody>;
export type LoginMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Login user
 */
export declare const useLogin: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
        data: BodyType<LoginBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof login>>, TError, {
    data: BodyType<LoginBody>;
}, TContext>;
/**
 * @summary Register new shop owner
 */
export declare const getRegisterUrl: () => string;
export declare const register: (registerBody: RegisterBody, options?: RequestInit) => Promise<RegisterPendingResponse>;
export declare const getRegisterMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof register>>, TError, {
        data: BodyType<RegisterBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof register>>, TError, {
    data: BodyType<RegisterBody>;
}, TContext>;
export type RegisterMutationResult = NonNullable<Awaited<ReturnType<typeof register>>>;
export type RegisterMutationBody = BodyType<RegisterBody>;
export type RegisterMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Register new shop owner
 */
export declare const useRegister: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof register>>, TError, {
        data: BodyType<RegisterBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof register>>, TError, {
    data: BodyType<RegisterBody>;
}, TContext>;
/**
 * @summary Get current user
 */
export declare const getGetMeUrl: () => string;
export declare const getMe: (options?: RequestInit) => Promise<User>;
export declare const getGetMeQueryKey: () => readonly ["/api/auth/me"];
export declare const getGetMeQueryOptions: <TData = Awaited<ReturnType<typeof getMe>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMeQueryResult = NonNullable<Awaited<ReturnType<typeof getMe>>>;
export type GetMeQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get current user
 */
export declare function useGetMe<TData = Awaited<ReturnType<typeof getMe>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Refresh access token using a refresh token
 */
export declare const getRefreshTokenUrl: () => string;
export declare const refreshToken: (refreshBody: RefreshBody, options?: RequestInit) => Promise<RefreshResponse>;
export declare const getRefreshTokenMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof refreshToken>>, TError, {
        data: BodyType<RefreshBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof refreshToken>>, TError, {
    data: BodyType<RefreshBody>;
}, TContext>;
export type RefreshTokenMutationResult = NonNullable<Awaited<ReturnType<typeof refreshToken>>>;
export type RefreshTokenMutationBody = BodyType<RefreshBody>;
export type RefreshTokenMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Refresh access token using a refresh token
 */
export declare const useRefreshToken: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof refreshToken>>, TError, {
        data: BodyType<RefreshBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof refreshToken>>, TError, {
    data: BodyType<RefreshBody>;
}, TContext>;
/**
 * @summary Revoke refresh token (logout)
 */
export declare const getLogoutUrl: () => string;
export declare const logout: (logoutBody: LogoutBody, options?: RequestInit) => Promise<void>;
export declare const getLogoutMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, {
        data: BodyType<LogoutBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, {
    data: BodyType<LogoutBody>;
}, TContext>;
export type LogoutMutationResult = NonNullable<Awaited<ReturnType<typeof logout>>>;
export type LogoutMutationBody = BodyType<LogoutBody>;
export type LogoutMutationError = ErrorType<unknown>;
/**
 * @summary Revoke refresh token (logout)
 */
export declare const useLogout: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, {
        data: BodyType<LogoutBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof logout>>, TError, {
    data: BodyType<LogoutBody>;
}, TContext>;
/**
 * @summary List all users in the shop (admin only)
 */
export declare const getListShopUsersUrl: () => string;
export declare const listShopUsers: (options?: RequestInit) => Promise<ShopUser[]>;
export declare const getListShopUsersQueryKey: () => readonly ["/api/auth/users"];
export declare const getListShopUsersQueryOptions: <TData = Awaited<ReturnType<typeof listShopUsers>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listShopUsers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listShopUsers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListShopUsersQueryResult = NonNullable<Awaited<ReturnType<typeof listShopUsers>>>;
export type ListShopUsersQueryError = ErrorType<ErrorResponse>;
/**
 * @summary List all users in the shop (admin only)
 */
export declare function useListShopUsers<TData = Awaited<ReturnType<typeof listShopUsers>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listShopUsers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Invite a user to the shop (admin only)
 */
export declare const getInviteUserUrl: () => string;
export declare const inviteUser: (inviteUserBody: InviteUserBody, options?: RequestInit) => Promise<ShopUser>;
export declare const getInviteUserMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof inviteUser>>, TError, {
        data: BodyType<InviteUserBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof inviteUser>>, TError, {
    data: BodyType<InviteUserBody>;
}, TContext>;
export type InviteUserMutationResult = NonNullable<Awaited<ReturnType<typeof inviteUser>>>;
export type InviteUserMutationBody = BodyType<InviteUserBody>;
export type InviteUserMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Invite a user to the shop (admin only)
 */
export declare const useInviteUser: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof inviteUser>>, TError, {
        data: BodyType<InviteUserBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof inviteUser>>, TError, {
    data: BodyType<InviteUserBody>;
}, TContext>;
/**
 * @summary Update user role or status (admin only)
 */
export declare const getUpdateShopUserUrl: (id: number) => string;
export declare const updateShopUser: (id: number, updateUserBody: UpdateUserBody, options?: RequestInit) => Promise<ShopUser>;
export declare const getUpdateShopUserMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateShopUser>>, TError, {
        id: number;
        data: BodyType<UpdateUserBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateShopUser>>, TError, {
    id: number;
    data: BodyType<UpdateUserBody>;
}, TContext>;
export type UpdateShopUserMutationResult = NonNullable<Awaited<ReturnType<typeof updateShopUser>>>;
export type UpdateShopUserMutationBody = BodyType<UpdateUserBody>;
export type UpdateShopUserMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Update user role or status (admin only)
 */
export declare const useUpdateShopUser: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateShopUser>>, TError, {
        id: number;
        data: BodyType<UpdateUserBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateShopUser>>, TError, {
    id: number;
    data: BodyType<UpdateUserBody>;
}, TContext>;
/**
 * @summary Deactivate a user (admin only)
 */
export declare const getDeleteShopUserUrl: (id: number) => string;
export declare const deleteShopUser: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteShopUserMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteShopUser>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteShopUser>>, TError, {
    id: number;
}, TContext>;
export type DeleteShopUserMutationResult = NonNullable<Awaited<ReturnType<typeof deleteShopUser>>>;
export type DeleteShopUserMutationError = ErrorType<unknown>;
/**
 * @summary Deactivate a user (admin only)
 */
export declare const useDeleteShopUser: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteShopUser>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteShopUser>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary List all categories
 */
export declare const getListCategoriesUrl: () => string;
export declare const listCategories: (options?: RequestInit) => Promise<Category[]>;
export declare const getListCategoriesQueryKey: () => readonly ["/api/categories"];
export declare const getListCategoriesQueryOptions: <TData = Awaited<ReturnType<typeof listCategories>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCategories>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listCategories>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListCategoriesQueryResult = NonNullable<Awaited<ReturnType<typeof listCategories>>>;
export type ListCategoriesQueryError = ErrorType<unknown>;
/**
 * @summary List all categories
 */
export declare function useListCategories<TData = Awaited<ReturnType<typeof listCategories>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCategories>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a category
 */
export declare const getCreateCategoryUrl: () => string;
export declare const createCategory: (createCategoryBody: CreateCategoryBody, options?: RequestInit) => Promise<Category>;
export declare const getCreateCategoryMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createCategory>>, TError, {
        data: BodyType<CreateCategoryBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createCategory>>, TError, {
    data: BodyType<CreateCategoryBody>;
}, TContext>;
export type CreateCategoryMutationResult = NonNullable<Awaited<ReturnType<typeof createCategory>>>;
export type CreateCategoryMutationBody = BodyType<CreateCategoryBody>;
export type CreateCategoryMutationError = ErrorType<unknown>;
/**
 * @summary Create a category
 */
export declare const useCreateCategory: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createCategory>>, TError, {
        data: BodyType<CreateCategoryBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createCategory>>, TError, {
    data: BodyType<CreateCategoryBody>;
}, TContext>;
/**
 * @summary Update a category
 */
export declare const getUpdateCategoryUrl: (id: number) => string;
export declare const updateCategory: (id: number, createCategoryBody: CreateCategoryBody, options?: RequestInit) => Promise<Category>;
export declare const getUpdateCategoryMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCategory>>, TError, {
        id: number;
        data: BodyType<CreateCategoryBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateCategory>>, TError, {
    id: number;
    data: BodyType<CreateCategoryBody>;
}, TContext>;
export type UpdateCategoryMutationResult = NonNullable<Awaited<ReturnType<typeof updateCategory>>>;
export type UpdateCategoryMutationBody = BodyType<CreateCategoryBody>;
export type UpdateCategoryMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Update a category
 */
export declare const useUpdateCategory: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCategory>>, TError, {
        id: number;
        data: BodyType<CreateCategoryBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateCategory>>, TError, {
    id: number;
    data: BodyType<CreateCategoryBody>;
}, TContext>;
/**
 * @summary Delete a category
 */
export declare const getDeleteCategoryUrl: (id: number) => string;
export declare const deleteCategory: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteCategoryMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteCategory>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteCategory>>, TError, {
    id: number;
}, TContext>;
export type DeleteCategoryMutationResult = NonNullable<Awaited<ReturnType<typeof deleteCategory>>>;
export type DeleteCategoryMutationError = ErrorType<unknown>;
/**
 * @summary Delete a category
 */
export declare const useDeleteCategory: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteCategory>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteCategory>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary List all products
 */
export declare const getListProductsUrl: (params?: ListProductsParams) => string;
export declare const listProducts: (params?: ListProductsParams, options?: RequestInit) => Promise<Product[]>;
export declare const getListProductsQueryKey: (params?: ListProductsParams) => readonly ["/api/products", ...ListProductsParams[]];
export declare const getListProductsQueryOptions: <TData = Awaited<ReturnType<typeof listProducts>>, TError = ErrorType<unknown>>(params?: ListProductsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProducts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listProducts>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListProductsQueryResult = NonNullable<Awaited<ReturnType<typeof listProducts>>>;
export type ListProductsQueryError = ErrorType<unknown>;
/**
 * @summary List all products
 */
export declare function useListProducts<TData = Awaited<ReturnType<typeof listProducts>>, TError = ErrorType<unknown>>(params?: ListProductsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProducts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a product
 */
export declare const getCreateProductUrl: () => string;
export declare const createProduct: (createProductBody: CreateProductBody, options?: RequestInit) => Promise<Product>;
export declare const getCreateProductMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createProduct>>, TError, {
        data: BodyType<CreateProductBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createProduct>>, TError, {
    data: BodyType<CreateProductBody>;
}, TContext>;
export type CreateProductMutationResult = NonNullable<Awaited<ReturnType<typeof createProduct>>>;
export type CreateProductMutationBody = BodyType<CreateProductBody>;
export type CreateProductMutationError = ErrorType<unknown>;
/**
 * @summary Create a product
 */
export declare const useCreateProduct: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createProduct>>, TError, {
        data: BodyType<CreateProductBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createProduct>>, TError, {
    data: BodyType<CreateProductBody>;
}, TContext>;
/**
 * @summary Get a product
 */
export declare const getGetProductUrl: (id: number) => string;
export declare const getProduct: (id: number, options?: RequestInit) => Promise<Product>;
export declare const getGetProductQueryKey: (id: number) => readonly [`/api/products/${number}`];
export declare const getGetProductQueryOptions: <TData = Awaited<ReturnType<typeof getProduct>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProduct>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getProduct>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetProductQueryResult = NonNullable<Awaited<ReturnType<typeof getProduct>>>;
export type GetProductQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get a product
 */
export declare function useGetProduct<TData = Awaited<ReturnType<typeof getProduct>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProduct>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update a product
 */
export declare const getUpdateProductUrl: (id: number) => string;
export declare const updateProduct: (id: number, updateProductBody: UpdateProductBody, options?: RequestInit) => Promise<Product>;
export declare const getUpdateProductMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateProduct>>, TError, {
        id: number;
        data: BodyType<UpdateProductBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateProduct>>, TError, {
    id: number;
    data: BodyType<UpdateProductBody>;
}, TContext>;
export type UpdateProductMutationResult = NonNullable<Awaited<ReturnType<typeof updateProduct>>>;
export type UpdateProductMutationBody = BodyType<UpdateProductBody>;
export type UpdateProductMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Update a product
 */
export declare const useUpdateProduct: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateProduct>>, TError, {
        id: number;
        data: BodyType<UpdateProductBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateProduct>>, TError, {
    id: number;
    data: BodyType<UpdateProductBody>;
}, TContext>;
/**
 * @summary Delete a product
 */
export declare const getDeleteProductUrl: (id: number) => string;
export declare const deleteProduct: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteProductMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteProduct>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteProduct>>, TError, {
    id: number;
}, TContext>;
export type DeleteProductMutationResult = NonNullable<Awaited<ReturnType<typeof deleteProduct>>>;
export type DeleteProductMutationError = ErrorType<unknown>;
/**
 * @summary Delete a product
 */
export declare const useDeleteProduct: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteProduct>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteProduct>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary List customers
 */
export declare const getListCustomersUrl: (params?: ListCustomersParams) => string;
export declare const listCustomers: (params?: ListCustomersParams, options?: RequestInit) => Promise<Customer[]>;
export declare const getListCustomersQueryKey: (params?: ListCustomersParams) => readonly ["/api/customers", ...ListCustomersParams[]];
export declare const getListCustomersQueryOptions: <TData = Awaited<ReturnType<typeof listCustomers>>, TError = ErrorType<unknown>>(params?: ListCustomersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCustomers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listCustomers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListCustomersQueryResult = NonNullable<Awaited<ReturnType<typeof listCustomers>>>;
export type ListCustomersQueryError = ErrorType<unknown>;
/**
 * @summary List customers
 */
export declare function useListCustomers<TData = Awaited<ReturnType<typeof listCustomers>>, TError = ErrorType<unknown>>(params?: ListCustomersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCustomers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a customer
 */
export declare const getCreateCustomerUrl: () => string;
export declare const createCustomer: (createCustomerBody: CreateCustomerBody, options?: RequestInit) => Promise<Customer>;
export declare const getCreateCustomerMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createCustomer>>, TError, {
        data: BodyType<CreateCustomerBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createCustomer>>, TError, {
    data: BodyType<CreateCustomerBody>;
}, TContext>;
export type CreateCustomerMutationResult = NonNullable<Awaited<ReturnType<typeof createCustomer>>>;
export type CreateCustomerMutationBody = BodyType<CreateCustomerBody>;
export type CreateCustomerMutationError = ErrorType<unknown>;
/**
 * @summary Create a customer
 */
export declare const useCreateCustomer: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createCustomer>>, TError, {
        data: BodyType<CreateCustomerBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createCustomer>>, TError, {
    data: BodyType<CreateCustomerBody>;
}, TContext>;
/**
 * @summary Get a customer
 */
export declare const getGetCustomerUrl: (id: number) => string;
export declare const getCustomer: (id: number, options?: RequestInit) => Promise<Customer>;
export declare const getGetCustomerQueryKey: (id: number) => readonly [`/api/customers/${number}`];
export declare const getGetCustomerQueryOptions: <TData = Awaited<ReturnType<typeof getCustomer>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCustomer>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCustomer>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCustomerQueryResult = NonNullable<Awaited<ReturnType<typeof getCustomer>>>;
export type GetCustomerQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get a customer
 */
export declare function useGetCustomer<TData = Awaited<ReturnType<typeof getCustomer>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCustomer>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update a customer
 */
export declare const getUpdateCustomerUrl: (id: number) => string;
export declare const updateCustomer: (id: number, updateCustomerBody: UpdateCustomerBody, options?: RequestInit) => Promise<Customer>;
export declare const getUpdateCustomerMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCustomer>>, TError, {
        id: number;
        data: BodyType<UpdateCustomerBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateCustomer>>, TError, {
    id: number;
    data: BodyType<UpdateCustomerBody>;
}, TContext>;
export type UpdateCustomerMutationResult = NonNullable<Awaited<ReturnType<typeof updateCustomer>>>;
export type UpdateCustomerMutationBody = BodyType<UpdateCustomerBody>;
export type UpdateCustomerMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Update a customer
 */
export declare const useUpdateCustomer: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCustomer>>, TError, {
        id: number;
        data: BodyType<UpdateCustomerBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateCustomer>>, TError, {
    id: number;
    data: BodyType<UpdateCustomerBody>;
}, TContext>;
/**
 * @summary Delete a customer (only if no ledger history)
 */
export declare const getDeleteCustomerUrl: (id: number) => string;
export declare const deleteCustomer: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteCustomerMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteCustomer>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteCustomer>>, TError, {
    id: number;
}, TContext>;
export type DeleteCustomerMutationResult = NonNullable<Awaited<ReturnType<typeof deleteCustomer>>>;
export type DeleteCustomerMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Delete a customer (only if no ledger history)
 */
export declare const useDeleteCustomer: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteCustomer>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteCustomer>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Collect payment from a customer (creates ledger entry)
 */
export declare const getCollectPaymentUrl: (id: number) => string;
export declare const collectPayment: (id: number, collectPaymentBody: CollectPaymentBody, options?: RequestInit) => Promise<Customer>;
export declare const getCollectPaymentMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof collectPayment>>, TError, {
        id: number;
        data: BodyType<CollectPaymentBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof collectPayment>>, TError, {
    id: number;
    data: BodyType<CollectPaymentBody>;
}, TContext>;
export type CollectPaymentMutationResult = NonNullable<Awaited<ReturnType<typeof collectPayment>>>;
export type CollectPaymentMutationBody = BodyType<CollectPaymentBody>;
export type CollectPaymentMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Collect payment from a customer (creates ledger entry)
 */
export declare const useCollectPayment: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof collectPayment>>, TError, {
        id: number;
        data: BodyType<CollectPaymentBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof collectPayment>>, TError, {
    id: number;
    data: BodyType<CollectPaymentBody>;
}, TContext>;
/**
 * @summary Get customer ledger transactions
 */
export declare const getGetCustomerLedgerUrl: (id: number) => string;
export declare const getCustomerLedger: (id: number, options?: RequestInit) => Promise<LedgerEntry[]>;
export declare const getGetCustomerLedgerQueryKey: (id: number) => readonly [`/api/customers/${number}/ledger`];
export declare const getGetCustomerLedgerQueryOptions: <TData = Awaited<ReturnType<typeof getCustomerLedger>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCustomerLedger>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCustomerLedger>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCustomerLedgerQueryResult = NonNullable<Awaited<ReturnType<typeof getCustomerLedger>>>;
export type GetCustomerLedgerQueryError = ErrorType<unknown>;
/**
 * @summary Get customer ledger transactions
 */
export declare function useGetCustomerLedger<TData = Awaited<ReturnType<typeof getCustomerLedger>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCustomerLedger>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List sales
 */
export declare const getListSalesUrl: (params?: ListSalesParams) => string;
export declare const listSales: (params?: ListSalesParams, options?: RequestInit) => Promise<Sale[]>;
export declare const getListSalesQueryKey: (params?: ListSalesParams) => readonly ["/api/sales", ...ListSalesParams[]];
export declare const getListSalesQueryOptions: <TData = Awaited<ReturnType<typeof listSales>>, TError = ErrorType<unknown>>(params?: ListSalesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSales>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listSales>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListSalesQueryResult = NonNullable<Awaited<ReturnType<typeof listSales>>>;
export type ListSalesQueryError = ErrorType<unknown>;
/**
 * @summary List sales
 */
export declare function useListSales<TData = Awaited<ReturnType<typeof listSales>>, TError = ErrorType<unknown>>(params?: ListSalesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSales>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a sale (checkout)
 */
export declare const getCreateSaleUrl: () => string;
export declare const createSale: (createSaleBody: CreateSaleBody, options?: RequestInit) => Promise<Sale>;
export declare const getCreateSaleMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createSale>>, TError, {
        data: BodyType<CreateSaleBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createSale>>, TError, {
    data: BodyType<CreateSaleBody>;
}, TContext>;
export type CreateSaleMutationResult = NonNullable<Awaited<ReturnType<typeof createSale>>>;
export type CreateSaleMutationBody = BodyType<CreateSaleBody>;
export type CreateSaleMutationError = ErrorType<unknown>;
/**
 * @summary Create a sale (checkout)
 */
export declare const useCreateSale: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createSale>>, TError, {
        data: BodyType<CreateSaleBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createSale>>, TError, {
    data: BodyType<CreateSaleBody>;
}, TContext>;
/**
 * @summary Get a sale with items
 */
export declare const getGetSaleUrl: (id: number) => string;
export declare const getSale: (id: number, options?: RequestInit) => Promise<SaleDetail>;
export declare const getGetSaleQueryKey: (id: number) => readonly [`/api/sales/${number}`];
export declare const getGetSaleQueryOptions: <TData = Awaited<ReturnType<typeof getSale>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSale>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSale>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSaleQueryResult = NonNullable<Awaited<ReturnType<typeof getSale>>>;
export type GetSaleQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get a sale with items
 */
export declare function useGetSale<TData = Awaited<ReturnType<typeof getSale>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSale>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List inventory with stock levels
 */
export declare const getListInventoryUrl: () => string;
export declare const listInventory: (options?: RequestInit) => Promise<InventoryItem[]>;
export declare const getListInventoryQueryKey: () => readonly ["/api/inventory"];
export declare const getListInventoryQueryOptions: <TData = Awaited<ReturnType<typeof listInventory>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listInventory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listInventory>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListInventoryQueryResult = NonNullable<Awaited<ReturnType<typeof listInventory>>>;
export type ListInventoryQueryError = ErrorType<unknown>;
/**
 * @summary List inventory with stock levels
 */
export declare function useListInventory<TData = Awaited<ReturnType<typeof listInventory>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listInventory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Adjust product stock
 */
export declare const getAdjustInventoryUrl: () => string;
export declare const adjustInventory: (adjustInventoryBody: AdjustInventoryBody, options?: RequestInit) => Promise<InventoryItem>;
export declare const getAdjustInventoryMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adjustInventory>>, TError, {
        data: BodyType<AdjustInventoryBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adjustInventory>>, TError, {
    data: BodyType<AdjustInventoryBody>;
}, TContext>;
export type AdjustInventoryMutationResult = NonNullable<Awaited<ReturnType<typeof adjustInventory>>>;
export type AdjustInventoryMutationBody = BodyType<AdjustInventoryBody>;
export type AdjustInventoryMutationError = ErrorType<unknown>;
/**
 * @summary Adjust product stock
 */
export declare const useAdjustInventory: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adjustInventory>>, TError, {
        data: BodyType<AdjustInventoryBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adjustInventory>>, TError, {
    data: BodyType<AdjustInventoryBody>;
}, TContext>;
/**
 * @summary List inventory adjustment history
 */
export declare const getListInventoryAdjustmentsUrl: () => string;
export declare const listInventoryAdjustments: (options?: RequestInit) => Promise<InventoryAdjustment[]>;
export declare const getListInventoryAdjustmentsQueryKey: () => readonly ["/api/inventory/adjustments"];
export declare const getListInventoryAdjustmentsQueryOptions: <TData = Awaited<ReturnType<typeof listInventoryAdjustments>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listInventoryAdjustments>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listInventoryAdjustments>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListInventoryAdjustmentsQueryResult = NonNullable<Awaited<ReturnType<typeof listInventoryAdjustments>>>;
export type ListInventoryAdjustmentsQueryError = ErrorType<unknown>;
/**
 * @summary List inventory adjustment history
 */
export declare function useListInventoryAdjustments<TData = Awaited<ReturnType<typeof listInventoryAdjustments>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listInventoryAdjustments>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get dashboard KPI summary
 */
export declare const getGetDashboardSummaryUrl: () => string;
export declare const getDashboardSummary: (options?: RequestInit) => Promise<DashboardSummary>;
export declare const getGetDashboardSummaryQueryKey: () => readonly ["/api/dashboard/summary"];
export declare const getGetDashboardSummaryQueryOptions: <TData = Awaited<ReturnType<typeof getDashboardSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDashboardSummary>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDashboardSummaryQueryResult = NonNullable<Awaited<ReturnType<typeof getDashboardSummary>>>;
export type GetDashboardSummaryQueryError = ErrorType<unknown>;
/**
 * @summary Get dashboard KPI summary
 */
export declare function useGetDashboardSummary<TData = Awaited<ReturnType<typeof getDashboardSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get recent sales for dashboard
 */
export declare const getGetRecentSalesUrl: () => string;
export declare const getRecentSales: (options?: RequestInit) => Promise<Sale[]>;
export declare const getGetRecentSalesQueryKey: () => readonly ["/api/dashboard/recent-sales"];
export declare const getGetRecentSalesQueryOptions: <TData = Awaited<ReturnType<typeof getRecentSales>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRecentSales>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getRecentSales>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetRecentSalesQueryResult = NonNullable<Awaited<ReturnType<typeof getRecentSales>>>;
export type GetRecentSalesQueryError = ErrorType<unknown>;
/**
 * @summary Get recent sales for dashboard
 */
export declare function useGetRecentSales<TData = Awaited<ReturnType<typeof getRecentSales>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRecentSales>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get top selling products
 */
export declare const getGetTopProductsUrl: () => string;
export declare const getTopProducts: (options?: RequestInit) => Promise<TopProduct[]>;
export declare const getGetTopProductsQueryKey: () => readonly ["/api/dashboard/top-products"];
export declare const getGetTopProductsQueryOptions: <TData = Awaited<ReturnType<typeof getTopProducts>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTopProducts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getTopProducts>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetTopProductsQueryResult = NonNullable<Awaited<ReturnType<typeof getTopProducts>>>;
export type GetTopProductsQueryError = ErrorType<unknown>;
/**
 * @summary Get top selling products
 */
export declare function useGetTopProducts<TData = Awaited<ReturnType<typeof getTopProducts>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTopProducts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get sales data for chart (last 30 days)
 */
export declare const getGetSalesChartUrl: () => string;
export declare const getSalesChart: (options?: RequestInit) => Promise<SalesChartPoint[]>;
export declare const getGetSalesChartQueryKey: () => readonly ["/api/dashboard/sales-chart"];
export declare const getGetSalesChartQueryOptions: <TData = Awaited<ReturnType<typeof getSalesChart>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSalesChart>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSalesChart>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSalesChartQueryResult = NonNullable<Awaited<ReturnType<typeof getSalesChart>>>;
export type GetSalesChartQueryError = ErrorType<unknown>;
/**
 * @summary Get sales data for chart (last 30 days)
 */
export declare function useGetSalesChart<TData = Awaited<ReturnType<typeof getSalesChart>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSalesChart>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get aggregated analytics by period (week or month)
 */
export declare const getGetDashboardAnalyticsUrl: (params?: GetDashboardAnalyticsParams) => string;
export declare const getDashboardAnalytics: (params?: GetDashboardAnalyticsParams, options?: RequestInit) => Promise<AnalyticsPeriodPoint[]>;
export declare const getGetDashboardAnalyticsQueryKey: (params?: GetDashboardAnalyticsParams) => readonly ["/api/dashboard/analytics", ...GetDashboardAnalyticsParams[]];
export declare const getGetDashboardAnalyticsQueryOptions: <TData = Awaited<ReturnType<typeof getDashboardAnalytics>>, TError = ErrorType<unknown>>(params?: GetDashboardAnalyticsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardAnalytics>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDashboardAnalytics>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDashboardAnalyticsQueryResult = NonNullable<Awaited<ReturnType<typeof getDashboardAnalytics>>>;
export type GetDashboardAnalyticsQueryError = ErrorType<unknown>;
/**
 * @summary Get aggregated analytics by period (week or month)
 */
export declare function useGetDashboardAnalytics<TData = Awaited<ReturnType<typeof getDashboardAnalytics>>, TError = ErrorType<unknown>>(params?: GetDashboardAnalyticsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardAnalytics>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get sales heatmap by day of week (last 30 days)
 */
export declare const getGetDashboardHeatmapUrl: () => string;
export declare const getDashboardHeatmap: (options?: RequestInit) => Promise<HeatmapPoint[]>;
export declare const getGetDashboardHeatmapQueryKey: () => readonly ["/api/dashboard/heatmap"];
export declare const getGetDashboardHeatmapQueryOptions: <TData = Awaited<ReturnType<typeof getDashboardHeatmap>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardHeatmap>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDashboardHeatmap>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDashboardHeatmapQueryResult = NonNullable<Awaited<ReturnType<typeof getDashboardHeatmap>>>;
export type GetDashboardHeatmapQueryError = ErrorType<unknown>;
/**
 * @summary Get sales heatmap by day of week (last 30 days)
 */
export declare function useGetDashboardHeatmap<TData = Awaited<ReturnType<typeof getDashboardHeatmap>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardHeatmap>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Sales report
 */
export declare const getGetSalesReportUrl: (params?: GetSalesReportParams) => string;
export declare const getSalesReport: (params?: GetSalesReportParams, options?: RequestInit) => Promise<SalesReport>;
export declare const getGetSalesReportQueryKey: (params?: GetSalesReportParams) => readonly ["/api/reports/sales", ...GetSalesReportParams[]];
export declare const getGetSalesReportQueryOptions: <TData = Awaited<ReturnType<typeof getSalesReport>>, TError = ErrorType<unknown>>(params?: GetSalesReportParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSalesReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSalesReport>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSalesReportQueryResult = NonNullable<Awaited<ReturnType<typeof getSalesReport>>>;
export type GetSalesReportQueryError = ErrorType<unknown>;
/**
 * @summary Sales report
 */
export declare function useGetSalesReport<TData = Awaited<ReturnType<typeof getSalesReport>>, TError = ErrorType<unknown>>(params?: GetSalesReportParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSalesReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Inventory report
 */
export declare const getGetInventoryReportUrl: () => string;
export declare const getInventoryReport: (options?: RequestInit) => Promise<InventoryReport>;
export declare const getGetInventoryReportQueryKey: () => readonly ["/api/reports/inventory"];
export declare const getGetInventoryReportQueryOptions: <TData = Awaited<ReturnType<typeof getInventoryReport>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getInventoryReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getInventoryReport>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetInventoryReportQueryResult = NonNullable<Awaited<ReturnType<typeof getInventoryReport>>>;
export type GetInventoryReportQueryError = ErrorType<unknown>;
/**
 * @summary Inventory report
 */
export declare function useGetInventoryReport<TData = Awaited<ReturnType<typeof getInventoryReport>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getInventoryReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Profit report (revenue vs cost)
 */
export declare const getGetProfitReportUrl: (params?: GetProfitReportParams) => string;
export declare const getProfitReport: (params?: GetProfitReportParams, options?: RequestInit) => Promise<ProfitReport>;
export declare const getGetProfitReportQueryKey: (params?: GetProfitReportParams) => readonly ["/api/reports/profit", ...GetProfitReportParams[]];
export declare const getGetProfitReportQueryOptions: <TData = Awaited<ReturnType<typeof getProfitReport>>, TError = ErrorType<unknown>>(params?: GetProfitReportParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProfitReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getProfitReport>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetProfitReportQueryResult = NonNullable<Awaited<ReturnType<typeof getProfitReport>>>;
export type GetProfitReportQueryError = ErrorType<unknown>;
/**
 * @summary Profit report (revenue vs cost)
 */
export declare function useGetProfitReport<TData = Awaited<ReturnType<typeof getProfitReport>>, TError = ErrorType<unknown>>(params?: GetProfitReportParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProfitReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Product sales report
 */
export declare const getGetProductReportUrl: (params?: GetProductReportParams) => string;
export declare const getProductReport: (params?: GetProductReportParams, options?: RequestInit) => Promise<ProductReport>;
export declare const getGetProductReportQueryKey: (params?: GetProductReportParams) => readonly ["/api/reports/products", ...GetProductReportParams[]];
export declare const getGetProductReportQueryOptions: <TData = Awaited<ReturnType<typeof getProductReport>>, TError = ErrorType<unknown>>(params?: GetProductReportParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProductReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getProductReport>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetProductReportQueryResult = NonNullable<Awaited<ReturnType<typeof getProductReport>>>;
export type GetProductReportQueryError = ErrorType<unknown>;
/**
 * @summary Product sales report
 */
export declare function useGetProductReport<TData = Awaited<ReturnType<typeof getProductReport>>, TError = ErrorType<unknown>>(params?: GetProductReportParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProductReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Due report — customers with outstanding balance
 */
export declare const getGetDueReportUrl: () => string;
export declare const getDueReport: (options?: RequestInit) => Promise<DueReport>;
export declare const getGetDueReportQueryKey: () => readonly ["/api/reports/due"];
export declare const getGetDueReportQueryOptions: <TData = Awaited<ReturnType<typeof getDueReport>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDueReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDueReport>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDueReportQueryResult = NonNullable<Awaited<ReturnType<typeof getDueReport>>>;
export type GetDueReportQueryError = ErrorType<unknown>;
/**
 * @summary Due report — customers with outstanding balance
 */
export declare function useGetDueReport<TData = Awaited<ReturnType<typeof getDueReport>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDueReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Staff sales report
 */
export declare const getGetStaffReportUrl: (params?: GetStaffReportParams) => string;
export declare const getStaffReport: (params?: GetStaffReportParams, options?: RequestInit) => Promise<StaffReport>;
export declare const getGetStaffReportQueryKey: (params?: GetStaffReportParams) => readonly ["/api/reports/staff", ...GetStaffReportParams[]];
export declare const getGetStaffReportQueryOptions: <TData = Awaited<ReturnType<typeof getStaffReport>>, TError = ErrorType<unknown>>(params?: GetStaffReportParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStaffReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getStaffReport>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetStaffReportQueryResult = NonNullable<Awaited<ReturnType<typeof getStaffReport>>>;
export type GetStaffReportQueryError = ErrorType<unknown>;
/**
 * @summary Staff sales report
 */
export declare function useGetStaffReport<TData = Awaited<ReturnType<typeof getStaffReport>>, TError = ErrorType<unknown>>(params?: GetStaffReportParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStaffReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List notifications (auto-generates low stock + due alerts)
 */
export declare const getListNotificationsUrl: () => string;
export declare const listNotifications: (options?: RequestInit) => Promise<Notification[]>;
export declare const getListNotificationsQueryKey: () => readonly ["/api/notifications"];
export declare const getListNotificationsQueryOptions: <TData = Awaited<ReturnType<typeof listNotifications>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listNotifications>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listNotifications>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListNotificationsQueryResult = NonNullable<Awaited<ReturnType<typeof listNotifications>>>;
export type ListNotificationsQueryError = ErrorType<unknown>;
/**
 * @summary List notifications (auto-generates low stock + due alerts)
 */
export declare function useListNotifications<TData = Awaited<ReturnType<typeof listNotifications>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listNotifications>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get unread notification count
 */
export declare const getGetNotificationCountUrl: () => string;
export declare const getNotificationCount: (options?: RequestInit) => Promise<NotificationCount>;
export declare const getGetNotificationCountQueryKey: () => readonly ["/api/notifications/count"];
export declare const getGetNotificationCountQueryOptions: <TData = Awaited<ReturnType<typeof getNotificationCount>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getNotificationCount>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getNotificationCount>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetNotificationCountQueryResult = NonNullable<Awaited<ReturnType<typeof getNotificationCount>>>;
export type GetNotificationCountQueryError = ErrorType<unknown>;
/**
 * @summary Get unread notification count
 */
export declare function useGetNotificationCount<TData = Awaited<ReturnType<typeof getNotificationCount>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getNotificationCount>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Mark all notifications as read
 */
export declare const getMarkAllNotificationsReadUrl: () => string;
export declare const markAllNotificationsRead: (options?: RequestInit) => Promise<MarkAllNotificationsRead200>;
export declare const getMarkAllNotificationsReadMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof markAllNotificationsRead>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof markAllNotificationsRead>>, TError, void, TContext>;
export type MarkAllNotificationsReadMutationResult = NonNullable<Awaited<ReturnType<typeof markAllNotificationsRead>>>;
export type MarkAllNotificationsReadMutationError = ErrorType<unknown>;
/**
 * @summary Mark all notifications as read
 */
export declare const useMarkAllNotificationsRead: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof markAllNotificationsRead>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof markAllNotificationsRead>>, TError, void, TContext>;
/**
 * @summary Mark a notification as read
 */
export declare const getMarkNotificationReadUrl: (id: number) => string;
export declare const markNotificationRead: (id: number, options?: RequestInit) => Promise<Notification>;
export declare const getMarkNotificationReadMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof markNotificationRead>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof markNotificationRead>>, TError, {
    id: number;
}, TContext>;
export type MarkNotificationReadMutationResult = NonNullable<Awaited<ReturnType<typeof markNotificationRead>>>;
export type MarkNotificationReadMutationError = ErrorType<unknown>;
/**
 * @summary Mark a notification as read
 */
export declare const useMarkNotificationRead: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof markNotificationRead>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof markNotificationRead>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Delete a notification
 */
export declare const getDeleteNotificationUrl: (id: number) => string;
export declare const deleteNotification: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteNotificationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteNotification>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteNotification>>, TError, {
    id: number;
}, TContext>;
export type DeleteNotificationMutationResult = NonNullable<Awaited<ReturnType<typeof deleteNotification>>>;
export type DeleteNotificationMutationError = ErrorType<unknown>;
/**
 * @summary Delete a notification
 */
export declare const useDeleteNotification: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteNotification>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteNotification>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary List suppliers
 */
export declare const getListSuppliersUrl: (params?: ListSuppliersParams) => string;
export declare const listSuppliers: (params?: ListSuppliersParams, options?: RequestInit) => Promise<Supplier[]>;
export declare const getListSuppliersQueryKey: (params?: ListSuppliersParams) => readonly ["/api/suppliers", ...ListSuppliersParams[]];
export declare const getListSuppliersQueryOptions: <TData = Awaited<ReturnType<typeof listSuppliers>>, TError = ErrorType<unknown>>(params?: ListSuppliersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSuppliers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listSuppliers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListSuppliersQueryResult = NonNullable<Awaited<ReturnType<typeof listSuppliers>>>;
export type ListSuppliersQueryError = ErrorType<unknown>;
/**
 * @summary List suppliers
 */
export declare function useListSuppliers<TData = Awaited<ReturnType<typeof listSuppliers>>, TError = ErrorType<unknown>>(params?: ListSuppliersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSuppliers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a supplier
 */
export declare const getCreateSupplierUrl: () => string;
export declare const createSupplier: (createSupplierBody: CreateSupplierBody, options?: RequestInit) => Promise<Supplier>;
export declare const getCreateSupplierMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createSupplier>>, TError, {
        data: BodyType<CreateSupplierBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createSupplier>>, TError, {
    data: BodyType<CreateSupplierBody>;
}, TContext>;
export type CreateSupplierMutationResult = NonNullable<Awaited<ReturnType<typeof createSupplier>>>;
export type CreateSupplierMutationBody = BodyType<CreateSupplierBody>;
export type CreateSupplierMutationError = ErrorType<unknown>;
/**
 * @summary Create a supplier
 */
export declare const useCreateSupplier: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createSupplier>>, TError, {
        data: BodyType<CreateSupplierBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createSupplier>>, TError, {
    data: BodyType<CreateSupplierBody>;
}, TContext>;
/**
 * @summary Get supplier statistics
 */
export declare const getGetSupplierStatsUrl: () => string;
export declare const getSupplierStats: (options?: RequestInit) => Promise<SupplierStats>;
export declare const getGetSupplierStatsQueryKey: () => readonly ["/api/suppliers/stats"];
export declare const getGetSupplierStatsQueryOptions: <TData = Awaited<ReturnType<typeof getSupplierStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSupplierStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSupplierStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSupplierStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getSupplierStats>>>;
export type GetSupplierStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get supplier statistics
 */
export declare function useGetSupplierStats<TData = Awaited<ReturnType<typeof getSupplierStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSupplierStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get a supplier
 */
export declare const getGetSupplierUrl: (id: number) => string;
export declare const getSupplier: (id: number, options?: RequestInit) => Promise<Supplier>;
export declare const getGetSupplierQueryKey: (id: number) => readonly [`/api/suppliers/${number}`];
export declare const getGetSupplierQueryOptions: <TData = Awaited<ReturnType<typeof getSupplier>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSupplier>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSupplier>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSupplierQueryResult = NonNullable<Awaited<ReturnType<typeof getSupplier>>>;
export type GetSupplierQueryError = ErrorType<unknown>;
/**
 * @summary Get a supplier
 */
export declare function useGetSupplier<TData = Awaited<ReturnType<typeof getSupplier>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSupplier>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update a supplier
 */
export declare const getUpdateSupplierUrl: (id: number) => string;
export declare const updateSupplier: (id: number, updateSupplierBody: UpdateSupplierBody, options?: RequestInit) => Promise<Supplier>;
export declare const getUpdateSupplierMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSupplier>>, TError, {
        id: number;
        data: BodyType<UpdateSupplierBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateSupplier>>, TError, {
    id: number;
    data: BodyType<UpdateSupplierBody>;
}, TContext>;
export type UpdateSupplierMutationResult = NonNullable<Awaited<ReturnType<typeof updateSupplier>>>;
export type UpdateSupplierMutationBody = BodyType<UpdateSupplierBody>;
export type UpdateSupplierMutationError = ErrorType<unknown>;
/**
 * @summary Update a supplier
 */
export declare const useUpdateSupplier: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSupplier>>, TError, {
        id: number;
        data: BodyType<UpdateSupplierBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateSupplier>>, TError, {
    id: number;
    data: BodyType<UpdateSupplierBody>;
}, TContext>;
/**
 * @summary Delete a supplier
 */
export declare const getDeleteSupplierUrl: (id: number) => string;
export declare const deleteSupplier: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteSupplierMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteSupplier>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteSupplier>>, TError, {
    id: number;
}, TContext>;
export type DeleteSupplierMutationResult = NonNullable<Awaited<ReturnType<typeof deleteSupplier>>>;
export type DeleteSupplierMutationError = ErrorType<unknown>;
/**
 * @summary Delete a supplier
 */
export declare const useDeleteSupplier: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteSupplier>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteSupplier>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary List purchases
 */
export declare const getListPurchasesUrl: () => string;
export declare const listPurchases: (options?: RequestInit) => Promise<Purchase[]>;
export declare const getListPurchasesQueryKey: () => readonly ["/api/purchases"];
export declare const getListPurchasesQueryOptions: <TData = Awaited<ReturnType<typeof listPurchases>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPurchases>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listPurchases>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListPurchasesQueryResult = NonNullable<Awaited<ReturnType<typeof listPurchases>>>;
export type ListPurchasesQueryError = ErrorType<unknown>;
/**
 * @summary List purchases
 */
export declare function useListPurchases<TData = Awaited<ReturnType<typeof listPurchases>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPurchases>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a purchase (auto-updates stock)
 */
export declare const getCreatePurchaseUrl: () => string;
export declare const createPurchase: (createPurchaseBody: CreatePurchaseBody, options?: RequestInit) => Promise<PurchaseDetail>;
export declare const getCreatePurchaseMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createPurchase>>, TError, {
        data: BodyType<CreatePurchaseBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createPurchase>>, TError, {
    data: BodyType<CreatePurchaseBody>;
}, TContext>;
export type CreatePurchaseMutationResult = NonNullable<Awaited<ReturnType<typeof createPurchase>>>;
export type CreatePurchaseMutationBody = BodyType<CreatePurchaseBody>;
export type CreatePurchaseMutationError = ErrorType<unknown>;
/**
 * @summary Create a purchase (auto-updates stock)
 */
export declare const useCreatePurchase: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createPurchase>>, TError, {
        data: BodyType<CreatePurchaseBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createPurchase>>, TError, {
    data: BodyType<CreatePurchaseBody>;
}, TContext>;
/**
 * @summary Get purchase statistics
 */
export declare const getGetPurchaseStatsUrl: () => string;
export declare const getPurchaseStats: (options?: RequestInit) => Promise<PurchaseStats>;
export declare const getGetPurchaseStatsQueryKey: () => readonly ["/api/purchases/stats"];
export declare const getGetPurchaseStatsQueryOptions: <TData = Awaited<ReturnType<typeof getPurchaseStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPurchaseStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPurchaseStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPurchaseStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getPurchaseStats>>>;
export type GetPurchaseStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get purchase statistics
 */
export declare function useGetPurchaseStats<TData = Awaited<ReturnType<typeof getPurchaseStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPurchaseStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get a purchase with items
 */
export declare const getGetPurchaseUrl: (id: number) => string;
export declare const getPurchase: (id: number, options?: RequestInit) => Promise<PurchaseDetail>;
export declare const getGetPurchaseQueryKey: (id: number) => readonly [`/api/purchases/${number}`];
export declare const getGetPurchaseQueryOptions: <TData = Awaited<ReturnType<typeof getPurchase>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPurchase>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPurchase>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPurchaseQueryResult = NonNullable<Awaited<ReturnType<typeof getPurchase>>>;
export type GetPurchaseQueryError = ErrorType<unknown>;
/**
 * @summary Get a purchase with items
 */
export declare function useGetPurchase<TData = Awaited<ReturnType<typeof getPurchase>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPurchase>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Delete a purchase
 */
export declare const getDeletePurchaseUrl: (id: number) => string;
export declare const deletePurchase: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeletePurchaseMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deletePurchase>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deletePurchase>>, TError, {
    id: number;
}, TContext>;
export type DeletePurchaseMutationResult = NonNullable<Awaited<ReturnType<typeof deletePurchase>>>;
export type DeletePurchaseMutationError = ErrorType<unknown>;
/**
 * @summary Delete a purchase
 */
export declare const useDeletePurchase: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deletePurchase>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deletePurchase>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Pay supplier due for a purchase
 */
export declare const getPayPurchaseDueUrl: (id: number) => string;
export declare const payPurchaseDue: (id: number, payPurchaseDueBody: PayPurchaseDueBody, options?: RequestInit) => Promise<PurchaseDetail>;
export declare const getPayPurchaseDueMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof payPurchaseDue>>, TError, {
        id: number;
        data: BodyType<PayPurchaseDueBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof payPurchaseDue>>, TError, {
    id: number;
    data: BodyType<PayPurchaseDueBody>;
}, TContext>;
export type PayPurchaseDueMutationResult = NonNullable<Awaited<ReturnType<typeof payPurchaseDue>>>;
export type PayPurchaseDueMutationBody = BodyType<PayPurchaseDueBody>;
export type PayPurchaseDueMutationError = ErrorType<unknown>;
/**
 * @summary Pay supplier due for a purchase
 */
export declare const usePayPurchaseDue: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof payPurchaseDue>>, TError, {
        id: number;
        data: BodyType<PayPurchaseDueBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof payPurchaseDue>>, TError, {
    id: number;
    data: BodyType<PayPurchaseDueBody>;
}, TContext>;
/**
 * @summary Get full role permission matrix (all roles)
 */
export declare const getGetRolePermissionsUrl: () => string;
export declare const getRolePermissions: (options?: RequestInit) => Promise<RolePermissionsResponse>;
export declare const getGetRolePermissionsQueryKey: () => readonly ["/api/role-permissions"];
export declare const getGetRolePermissionsQueryOptions: <TData = Awaited<ReturnType<typeof getRolePermissions>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRolePermissions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getRolePermissions>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetRolePermissionsQueryResult = NonNullable<Awaited<ReturnType<typeof getRolePermissions>>>;
export type GetRolePermissionsQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get full role permission matrix (all roles)
 */
export declare function useGetRolePermissions<TData = Awaited<ReturnType<typeof getRolePermissions>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRolePermissions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update permissions for a role (admin only)
 */
export declare const getUpdateRolePermissionsUrl: (role: string) => string;
export declare const updateRolePermissions: (role: string, updateRolePermissionsBody: UpdateRolePermissionsBody, options?: RequestInit) => Promise<OkResponse>;
export declare const getUpdateRolePermissionsMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateRolePermissions>>, TError, {
        role: string;
        data: BodyType<UpdateRolePermissionsBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateRolePermissions>>, TError, {
    role: string;
    data: BodyType<UpdateRolePermissionsBody>;
}, TContext>;
export type UpdateRolePermissionsMutationResult = NonNullable<Awaited<ReturnType<typeof updateRolePermissions>>>;
export type UpdateRolePermissionsMutationBody = BodyType<UpdateRolePermissionsBody>;
export type UpdateRolePermissionsMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Update permissions for a role (admin only)
 */
export declare const useUpdateRolePermissions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateRolePermissions>>, TError, {
        role: string;
        data: BodyType<UpdateRolePermissionsBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateRolePermissions>>, TError, {
    role: string;
    data: BodyType<UpdateRolePermissionsBody>;
}, TContext>;
/**
 * @summary Reset a role's permissions to defaults (admin only)
 */
export declare const getResetRolePermissionsUrl: (role: string) => string;
export declare const resetRolePermissions: (role: string, options?: RequestInit) => Promise<OkResponse>;
export declare const getResetRolePermissionsMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof resetRolePermissions>>, TError, {
        role: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof resetRolePermissions>>, TError, {
    role: string;
}, TContext>;
export type ResetRolePermissionsMutationResult = NonNullable<Awaited<ReturnType<typeof resetRolePermissions>>>;
export type ResetRolePermissionsMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Reset a role's permissions to defaults (admin only)
 */
export declare const useResetRolePermissions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof resetRolePermissions>>, TError, {
        role: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof resetRolePermissions>>, TError, {
    role: string;
}, TContext>;
/**
 * @summary List custom roles for this shop (admin only)
 */
export declare const getListCustomRolesUrl: () => string;
export declare const listCustomRoles: (options?: RequestInit) => Promise<CustomRoleItem[]>;
export declare const getListCustomRolesQueryKey: () => readonly ["/api/custom-roles"];
export declare const getListCustomRolesQueryOptions: <TData = Awaited<ReturnType<typeof listCustomRoles>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCustomRoles>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listCustomRoles>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListCustomRolesQueryResult = NonNullable<Awaited<ReturnType<typeof listCustomRoles>>>;
export type ListCustomRolesQueryError = ErrorType<ErrorResponse>;
/**
 * @summary List custom roles for this shop (admin only)
 */
export declare function useListCustomRoles<TData = Awaited<ReturnType<typeof listCustomRoles>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCustomRoles>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a custom role (admin only)
 */
export declare const getCreateCustomRoleUrl: () => string;
export declare const createCustomRole: (createCustomRoleBody: CreateCustomRoleBody, options?: RequestInit) => Promise<CustomRoleItem>;
export declare const getCreateCustomRoleMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createCustomRole>>, TError, {
        data: BodyType<CreateCustomRoleBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createCustomRole>>, TError, {
    data: BodyType<CreateCustomRoleBody>;
}, TContext>;
export type CreateCustomRoleMutationResult = NonNullable<Awaited<ReturnType<typeof createCustomRole>>>;
export type CreateCustomRoleMutationBody = BodyType<CreateCustomRoleBody>;
export type CreateCustomRoleMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Create a custom role (admin only)
 */
export declare const useCreateCustomRole: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createCustomRole>>, TError, {
        data: BodyType<CreateCustomRoleBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createCustomRole>>, TError, {
    data: BodyType<CreateCustomRoleBody>;
}, TContext>;
/**
 * @summary Delete a custom role and its permissions (admin only)
 */
export declare const getDeleteCustomRoleUrl: (id: string) => string;
export declare const deleteCustomRole: (id: string, options?: RequestInit) => Promise<OkResponse>;
export declare const getDeleteCustomRoleMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteCustomRole>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteCustomRole>>, TError, {
    id: string;
}, TContext>;
export type DeleteCustomRoleMutationResult = NonNullable<Awaited<ReturnType<typeof deleteCustomRole>>>;
export type DeleteCustomRoleMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Delete a custom role and its permissions (admin only)
 */
export declare const useDeleteCustomRole: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteCustomRole>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteCustomRole>>, TError, {
    id: string;
}, TContext>;
/**
 * @summary List audit log entries (all roles)
 */
export declare const getGetAuditLogsUrl: (params?: GetAuditLogsParams) => string;
export declare const getAuditLogs: (params?: GetAuditLogsParams, options?: RequestInit) => Promise<AuditLogsResponse>;
export declare const getGetAuditLogsQueryKey: (params?: GetAuditLogsParams) => readonly ["/api/audit-logs", ...GetAuditLogsParams[]];
export declare const getGetAuditLogsQueryOptions: <TData = Awaited<ReturnType<typeof getAuditLogs>>, TError = ErrorType<ErrorResponse>>(params?: GetAuditLogsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAuditLogs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAuditLogs>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAuditLogsQueryResult = NonNullable<Awaited<ReturnType<typeof getAuditLogs>>>;
export type GetAuditLogsQueryError = ErrorType<ErrorResponse>;
/**
 * @summary List audit log entries (all roles)
 */
export declare function useGetAuditLogs<TData = Awaited<ReturnType<typeof getAuditLogs>>, TError = ErrorType<ErrorResponse>>(params?: GetAuditLogsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAuditLogs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get current shop info
 */
export declare const getGetShopUrl: () => string;
export declare const getShop: (options?: RequestInit) => Promise<ShopInfo>;
export declare const getGetShopQueryKey: () => readonly ["/api/shop"];
export declare const getGetShopQueryOptions: <TData = Awaited<ReturnType<typeof getShop>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getShop>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getShop>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetShopQueryResult = NonNullable<Awaited<ReturnType<typeof getShop>>>;
export type GetShopQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get current shop info
 */
export declare function useGetShop<TData = Awaited<ReturnType<typeof getShop>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getShop>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update shop info (admin only)
 */
export declare const getUpdateShopUrl: () => string;
export declare const updateShop: (updateShopBody: UpdateShopBody, options?: RequestInit) => Promise<ShopInfo>;
export declare const getUpdateShopMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateShop>>, TError, {
        data: BodyType<UpdateShopBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateShop>>, TError, {
    data: BodyType<UpdateShopBody>;
}, TContext>;
export type UpdateShopMutationResult = NonNullable<Awaited<ReturnType<typeof updateShop>>>;
export type UpdateShopMutationBody = BodyType<UpdateShopBody>;
export type UpdateShopMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Update shop info (admin only)
 */
export declare const useUpdateShop: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateShop>>, TError, {
        data: BodyType<UpdateShopBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateShop>>, TError, {
    data: BodyType<UpdateShopBody>;
}, TContext>;
/**
 * @summary List all users with their module access config
 */
export declare const getListUserAccessUrl: () => string;
export declare const listUserAccess: (options?: RequestInit) => Promise<UserAccessListResponse>;
export declare const getListUserAccessQueryKey: () => readonly ["/api/user-access"];
export declare const getListUserAccessQueryOptions: <TData = Awaited<ReturnType<typeof listUserAccess>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listUserAccess>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listUserAccess>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListUserAccessQueryResult = NonNullable<Awaited<ReturnType<typeof listUserAccess>>>;
export type ListUserAccessQueryError = ErrorType<void>;
/**
 * @summary List all users with their module access config
 */
export declare function useListUserAccess<TData = Awaited<ReturnType<typeof listUserAccess>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listUserAccess>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get a specific user's module access config
 */
export declare const getGetUserAccessUrl: (userId: number) => string;
export declare const getUserAccess: (userId: number, options?: RequestInit) => Promise<UserAccessDetail>;
export declare const getGetUserAccessQueryKey: (userId: number) => readonly [`/api/user-access/${number}`];
export declare const getGetUserAccessQueryOptions: <TData = Awaited<ReturnType<typeof getUserAccess>>, TError = ErrorType<void>>(userId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUserAccess>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getUserAccess>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetUserAccessQueryResult = NonNullable<Awaited<ReturnType<typeof getUserAccess>>>;
export type GetUserAccessQueryError = ErrorType<void>;
/**
 * @summary Get a specific user's module access config
 */
export declare function useGetUserAccess<TData = Awaited<ReturnType<typeof getUserAccess>>, TError = ErrorType<void>>(userId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUserAccess>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update a specific user's module access
 */
export declare const getUpdateUserAccessUrl: (userId: number) => string;
export declare const updateUserAccess: (userId: number, updateUserAccessRequest: UpdateUserAccessRequest, options?: RequestInit) => Promise<OkResponse>;
export declare const getUpdateUserAccessMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateUserAccess>>, TError, {
        userId: number;
        data: BodyType<UpdateUserAccessRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateUserAccess>>, TError, {
    userId: number;
    data: BodyType<UpdateUserAccessRequest>;
}, TContext>;
export type UpdateUserAccessMutationResult = NonNullable<Awaited<ReturnType<typeof updateUserAccess>>>;
export type UpdateUserAccessMutationBody = BodyType<UpdateUserAccessRequest>;
export type UpdateUserAccessMutationError = ErrorType<void>;
/**
 * @summary Update a specific user's module access
 */
export declare const useUpdateUserAccess: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateUserAccess>>, TError, {
        userId: number;
        data: BodyType<UpdateUserAccessRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateUserAccess>>, TError, {
    userId: number;
    data: BodyType<UpdateUserAccessRequest>;
}, TContext>;
/**
 * @summary Reset a user's access to role defaults
 */
export declare const getResetUserAccessUrl: (userId: number) => string;
export declare const resetUserAccess: (userId: number, options?: RequestInit) => Promise<OkResponse>;
export declare const getResetUserAccessMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof resetUserAccess>>, TError, {
        userId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof resetUserAccess>>, TError, {
    userId: number;
}, TContext>;
export type ResetUserAccessMutationResult = NonNullable<Awaited<ReturnType<typeof resetUserAccess>>>;
export type ResetUserAccessMutationError = ErrorType<void>;
/**
 * @summary Reset a user's access to role defaults
 */
export declare const useResetUserAccess: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof resetUserAccess>>, TError, {
        userId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof resetUserAccess>>, TError, {
    userId: number;
}, TContext>;
/**
 * @summary List attendance records with filters
 */
export declare const getListAttendanceUrl: (params?: ListAttendanceParams) => string;
export declare const listAttendance: (params?: ListAttendanceParams, options?: RequestInit) => Promise<AttendanceListResponse>;
export declare const getListAttendanceQueryKey: (params?: ListAttendanceParams) => readonly ["/api/attendance", ...ListAttendanceParams[]];
export declare const getListAttendanceQueryOptions: <TData = Awaited<ReturnType<typeof listAttendance>>, TError = ErrorType<void>>(params?: ListAttendanceParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAttendance>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listAttendance>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListAttendanceQueryResult = NonNullable<Awaited<ReturnType<typeof listAttendance>>>;
export type ListAttendanceQueryError = ErrorType<void>;
/**
 * @summary List attendance records with filters
 */
export declare function useListAttendance<TData = Awaited<ReturnType<typeof listAttendance>>, TError = ErrorType<void>>(params?: ListAttendanceParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAttendance>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Manually create an attendance record (admin)
 */
export declare const getCreateAttendanceUrl: () => string;
export declare const createAttendance: (createAttendanceRequest: CreateAttendanceRequest, options?: RequestInit) => Promise<AttendanceRecord>;
export declare const getCreateAttendanceMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createAttendance>>, TError, {
        data: BodyType<CreateAttendanceRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createAttendance>>, TError, {
    data: BodyType<CreateAttendanceRequest>;
}, TContext>;
export type CreateAttendanceMutationResult = NonNullable<Awaited<ReturnType<typeof createAttendance>>>;
export type CreateAttendanceMutationBody = BodyType<CreateAttendanceRequest>;
export type CreateAttendanceMutationError = ErrorType<void>;
/**
 * @summary Manually create an attendance record (admin)
 */
export declare const useCreateAttendance: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createAttendance>>, TError, {
        data: BodyType<CreateAttendanceRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createAttendance>>, TError, {
    data: BodyType<CreateAttendanceRequest>;
}, TContext>;
/**
 * @summary Get today's attendance status for all employees
 */
export declare const getGetTodayAttendanceUrl: () => string;
export declare const getTodayAttendance: (options?: RequestInit) => Promise<TodayAttendanceResponse>;
export declare const getGetTodayAttendanceQueryKey: () => readonly ["/api/attendance/today"];
export declare const getGetTodayAttendanceQueryOptions: <TData = Awaited<ReturnType<typeof getTodayAttendance>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTodayAttendance>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getTodayAttendance>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetTodayAttendanceQueryResult = NonNullable<Awaited<ReturnType<typeof getTodayAttendance>>>;
export type GetTodayAttendanceQueryError = ErrorType<void>;
/**
 * @summary Get today's attendance status for all employees
 */
export declare function useGetTodayAttendance<TData = Awaited<ReturnType<typeof getTodayAttendance>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTodayAttendance>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Record check-in for an employee
 */
export declare const getCheckInUrl: () => string;
export declare const checkIn: (checkInRequest: CheckInRequest, options?: RequestInit) => Promise<AttendanceRecord>;
export declare const getCheckInMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof checkIn>>, TError, {
        data: BodyType<CheckInRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof checkIn>>, TError, {
    data: BodyType<CheckInRequest>;
}, TContext>;
export type CheckInMutationResult = NonNullable<Awaited<ReturnType<typeof checkIn>>>;
export type CheckInMutationBody = BodyType<CheckInRequest>;
export type CheckInMutationError = ErrorType<void>;
/**
 * @summary Record check-in for an employee
 */
export declare const useCheckIn: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof checkIn>>, TError, {
        data: BodyType<CheckInRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof checkIn>>, TError, {
    data: BodyType<CheckInRequest>;
}, TContext>;
/**
 * @summary Record check-out for an employee
 */
export declare const getCheckOutUrl: () => string;
export declare const checkOut: (checkOutRequest: CheckOutRequest, options?: RequestInit) => Promise<AttendanceRecord>;
export declare const getCheckOutMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof checkOut>>, TError, {
        data: BodyType<CheckOutRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof checkOut>>, TError, {
    data: BodyType<CheckOutRequest>;
}, TContext>;
export type CheckOutMutationResult = NonNullable<Awaited<ReturnType<typeof checkOut>>>;
export type CheckOutMutationBody = BodyType<CheckOutRequest>;
export type CheckOutMutationError = ErrorType<void>;
/**
 * @summary Record check-out for an employee
 */
export declare const useCheckOut: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof checkOut>>, TError, {
        data: BodyType<CheckOutRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof checkOut>>, TError, {
    data: BodyType<CheckOutRequest>;
}, TContext>;
/**
 * @summary Monthly attendance report summary per employee
 */
export declare const getGetAttendanceReportUrl: (params: GetAttendanceReportParams) => string;
export declare const getAttendanceReport: (params: GetAttendanceReportParams, options?: RequestInit) => Promise<AttendanceReportResponse>;
export declare const getGetAttendanceReportQueryKey: (params?: GetAttendanceReportParams) => readonly ["/api/attendance/report", ...GetAttendanceReportParams[]];
export declare const getGetAttendanceReportQueryOptions: <TData = Awaited<ReturnType<typeof getAttendanceReport>>, TError = ErrorType<void>>(params: GetAttendanceReportParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAttendanceReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAttendanceReport>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAttendanceReportQueryResult = NonNullable<Awaited<ReturnType<typeof getAttendanceReport>>>;
export type GetAttendanceReportQueryError = ErrorType<void>;
/**
 * @summary Monthly attendance report summary per employee
 */
export declare function useGetAttendanceReport<TData = Awaited<ReturnType<typeof getAttendanceReport>>, TError = ErrorType<void>>(params: GetAttendanceReportParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAttendanceReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update an attendance record
 */
export declare const getUpdateAttendanceUrl: (id: number) => string;
export declare const updateAttendance: (id: number, updateAttendanceRequest: UpdateAttendanceRequest, options?: RequestInit) => Promise<AttendanceRecord>;
export declare const getUpdateAttendanceMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateAttendance>>, TError, {
        id: number;
        data: BodyType<UpdateAttendanceRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateAttendance>>, TError, {
    id: number;
    data: BodyType<UpdateAttendanceRequest>;
}, TContext>;
export type UpdateAttendanceMutationResult = NonNullable<Awaited<ReturnType<typeof updateAttendance>>>;
export type UpdateAttendanceMutationBody = BodyType<UpdateAttendanceRequest>;
export type UpdateAttendanceMutationError = ErrorType<void>;
/**
 * @summary Update an attendance record
 */
export declare const useUpdateAttendance: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateAttendance>>, TError, {
        id: number;
        data: BodyType<UpdateAttendanceRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateAttendance>>, TError, {
    id: number;
    data: BodyType<UpdateAttendanceRequest>;
}, TContext>;
/**
 * @summary Delete an attendance record
 */
export declare const getDeleteAttendanceUrl: (id: number) => string;
export declare const deleteAttendance: (id: number, options?: RequestInit) => Promise<OkResponse>;
export declare const getDeleteAttendanceMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteAttendance>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteAttendance>>, TError, {
    id: number;
}, TContext>;
export type DeleteAttendanceMutationResult = NonNullable<Awaited<ReturnType<typeof deleteAttendance>>>;
export type DeleteAttendanceMutationError = ErrorType<void>;
/**
 * @summary Delete an attendance record
 */
export declare const useDeleteAttendance: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteAttendance>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteAttendance>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary List all shifts for the shop
 */
export declare const getListShiftsUrl: () => string;
export declare const listShifts: (options?: RequestInit) => Promise<Shift[]>;
export declare const getListShiftsQueryKey: () => readonly ["/api/shifts"];
export declare const getListShiftsQueryOptions: <TData = Awaited<ReturnType<typeof listShifts>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listShifts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listShifts>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListShiftsQueryResult = NonNullable<Awaited<ReturnType<typeof listShifts>>>;
export type ListShiftsQueryError = ErrorType<void>;
/**
 * @summary List all shifts for the shop
 */
export declare function useListShifts<TData = Awaited<ReturnType<typeof listShifts>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listShifts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a new shift
 */
export declare const getCreateShiftUrl: () => string;
export declare const createShift: (createShiftRequest: CreateShiftRequest, options?: RequestInit) => Promise<Shift>;
export declare const getCreateShiftMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createShift>>, TError, {
        data: BodyType<CreateShiftRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createShift>>, TError, {
    data: BodyType<CreateShiftRequest>;
}, TContext>;
export type CreateShiftMutationResult = NonNullable<Awaited<ReturnType<typeof createShift>>>;
export type CreateShiftMutationBody = BodyType<CreateShiftRequest>;
export type CreateShiftMutationError = ErrorType<void>;
/**
 * @summary Create a new shift
 */
export declare const useCreateShift: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createShift>>, TError, {
        data: BodyType<CreateShiftRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createShift>>, TError, {
    data: BodyType<CreateShiftRequest>;
}, TContext>;
/**
 * @summary Update a shift
 */
export declare const getUpdateShiftUrl: (id: number) => string;
export declare const updateShift: (id: number, updateShiftRequest: UpdateShiftRequest, options?: RequestInit) => Promise<Shift>;
export declare const getUpdateShiftMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateShift>>, TError, {
        id: number;
        data: BodyType<UpdateShiftRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateShift>>, TError, {
    id: number;
    data: BodyType<UpdateShiftRequest>;
}, TContext>;
export type UpdateShiftMutationResult = NonNullable<Awaited<ReturnType<typeof updateShift>>>;
export type UpdateShiftMutationBody = BodyType<UpdateShiftRequest>;
export type UpdateShiftMutationError = ErrorType<void>;
/**
 * @summary Update a shift
 */
export declare const useUpdateShift: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateShift>>, TError, {
        id: number;
        data: BodyType<UpdateShiftRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateShift>>, TError, {
    id: number;
    data: BodyType<UpdateShiftRequest>;
}, TContext>;
/**
 * @summary Delete a shift
 */
export declare const getDeleteShiftUrl: (id: number) => string;
export declare const deleteShift: (id: number, options?: RequestInit) => Promise<DeleteShift200>;
export declare const getDeleteShiftMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteShift>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteShift>>, TError, {
    id: number;
}, TContext>;
export type DeleteShiftMutationResult = NonNullable<Awaited<ReturnType<typeof deleteShift>>>;
export type DeleteShiftMutationError = ErrorType<void>;
/**
 * @summary Delete a shift
 */
export declare const useDeleteShift: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteShift>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteShift>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary List duty schedule assignments
 */
export declare const getListSchedulesUrl: (params?: ListSchedulesParams) => string;
export declare const listSchedules: (params?: ListSchedulesParams, options?: RequestInit) => Promise<DutySchedule[]>;
export declare const getListSchedulesQueryKey: (params?: ListSchedulesParams) => readonly ["/api/schedules", ...ListSchedulesParams[]];
export declare const getListSchedulesQueryOptions: <TData = Awaited<ReturnType<typeof listSchedules>>, TError = ErrorType<unknown>>(params?: ListSchedulesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSchedules>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listSchedules>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListSchedulesQueryResult = NonNullable<Awaited<ReturnType<typeof listSchedules>>>;
export type ListSchedulesQueryError = ErrorType<unknown>;
/**
 * @summary List duty schedule assignments
 */
export declare function useListSchedules<TData = Awaited<ReturnType<typeof listSchedules>>, TError = ErrorType<unknown>>(params?: ListSchedulesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSchedules>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Assign a shift to an employee
 */
export declare const getCreateScheduleUrl: () => string;
export declare const createSchedule: (createScheduleRequest: CreateScheduleRequest, options?: RequestInit) => Promise<DutySchedule>;
export declare const getCreateScheduleMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createSchedule>>, TError, {
        data: BodyType<CreateScheduleRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createSchedule>>, TError, {
    data: BodyType<CreateScheduleRequest>;
}, TContext>;
export type CreateScheduleMutationResult = NonNullable<Awaited<ReturnType<typeof createSchedule>>>;
export type CreateScheduleMutationBody = BodyType<CreateScheduleRequest>;
export type CreateScheduleMutationError = ErrorType<void>;
/**
 * @summary Assign a shift to an employee
 */
export declare const useCreateSchedule: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createSchedule>>, TError, {
        data: BodyType<CreateScheduleRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createSchedule>>, TError, {
    data: BodyType<CreateScheduleRequest>;
}, TContext>;
/**
 * @summary Get weekly schedule template (employees x weekdays)
 */
export declare const getGetWeeklyScheduleUrl: () => string;
export declare const getWeeklySchedule: (options?: RequestInit) => Promise<WeeklyScheduleResponse>;
export declare const getGetWeeklyScheduleQueryKey: () => readonly ["/api/schedules/weekly"];
export declare const getGetWeeklyScheduleQueryOptions: <TData = Awaited<ReturnType<typeof getWeeklySchedule>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getWeeklySchedule>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getWeeklySchedule>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetWeeklyScheduleQueryResult = NonNullable<Awaited<ReturnType<typeof getWeeklySchedule>>>;
export type GetWeeklyScheduleQueryError = ErrorType<unknown>;
/**
 * @summary Get weekly schedule template (employees x weekdays)
 */
export declare function useGetWeeklySchedule<TData = Awaited<ReturnType<typeof getWeeklySchedule>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getWeeklySchedule>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get schedule for a calendar month
 */
export declare const getGetCalendarScheduleUrl: (params: GetCalendarScheduleParams) => string;
export declare const getCalendarSchedule: (params: GetCalendarScheduleParams, options?: RequestInit) => Promise<CalendarScheduleResponse>;
export declare const getGetCalendarScheduleQueryKey: (params?: GetCalendarScheduleParams) => readonly ["/api/schedules/calendar", ...GetCalendarScheduleParams[]];
export declare const getGetCalendarScheduleQueryOptions: <TData = Awaited<ReturnType<typeof getCalendarSchedule>>, TError = ErrorType<unknown>>(params: GetCalendarScheduleParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCalendarSchedule>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCalendarSchedule>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCalendarScheduleQueryResult = NonNullable<Awaited<ReturnType<typeof getCalendarSchedule>>>;
export type GetCalendarScheduleQueryError = ErrorType<unknown>;
/**
 * @summary Get schedule for a calendar month
 */
export declare function useGetCalendarSchedule<TData = Awaited<ReturnType<typeof getCalendarSchedule>>, TError = ErrorType<unknown>>(params: GetCalendarScheduleParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCalendarSchedule>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update a schedule entry
 */
export declare const getUpdateScheduleUrl: (id: number) => string;
export declare const updateSchedule: (id: number, updateScheduleRequest: UpdateScheduleRequest, options?: RequestInit) => Promise<DutySchedule>;
export declare const getUpdateScheduleMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSchedule>>, TError, {
        id: number;
        data: BodyType<UpdateScheduleRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateSchedule>>, TError, {
    id: number;
    data: BodyType<UpdateScheduleRequest>;
}, TContext>;
export type UpdateScheduleMutationResult = NonNullable<Awaited<ReturnType<typeof updateSchedule>>>;
export type UpdateScheduleMutationBody = BodyType<UpdateScheduleRequest>;
export type UpdateScheduleMutationError = ErrorType<void>;
/**
 * @summary Update a schedule entry
 */
export declare const useUpdateSchedule: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSchedule>>, TError, {
        id: number;
        data: BodyType<UpdateScheduleRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateSchedule>>, TError, {
    id: number;
    data: BodyType<UpdateScheduleRequest>;
}, TContext>;
/**
 * @summary Delete a schedule entry
 */
export declare const getDeleteScheduleUrl: (id: number) => string;
export declare const deleteSchedule: (id: number, options?: RequestInit) => Promise<DeleteSchedule200>;
export declare const getDeleteScheduleMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteSchedule>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteSchedule>>, TError, {
    id: number;
}, TContext>;
export type DeleteScheduleMutationResult = NonNullable<Awaited<ReturnType<typeof deleteSchedule>>>;
export type DeleteScheduleMutationError = ErrorType<void>;
/**
 * @summary Delete a schedule entry
 */
export declare const useDeleteSchedule: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteSchedule>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteSchedule>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary List all leave types for the shop
 */
export declare const getListLeaveTypesUrl: () => string;
export declare const listLeaveTypes: (options?: RequestInit) => Promise<LeaveType[]>;
export declare const getListLeaveTypesQueryKey: () => readonly ["/api/leave-types"];
export declare const getListLeaveTypesQueryOptions: <TData = Awaited<ReturnType<typeof listLeaveTypes>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listLeaveTypes>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listLeaveTypes>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListLeaveTypesQueryResult = NonNullable<Awaited<ReturnType<typeof listLeaveTypes>>>;
export type ListLeaveTypesQueryError = ErrorType<void>;
/**
 * @summary List all leave types for the shop
 */
export declare function useListLeaveTypes<TData = Awaited<ReturnType<typeof listLeaveTypes>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listLeaveTypes>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a new leave type
 */
export declare const getCreateLeaveTypeUrl: () => string;
export declare const createLeaveType: (createLeaveTypeRequest: CreateLeaveTypeRequest, options?: RequestInit) => Promise<LeaveType>;
export declare const getCreateLeaveTypeMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createLeaveType>>, TError, {
        data: BodyType<CreateLeaveTypeRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createLeaveType>>, TError, {
    data: BodyType<CreateLeaveTypeRequest>;
}, TContext>;
export type CreateLeaveTypeMutationResult = NonNullable<Awaited<ReturnType<typeof createLeaveType>>>;
export type CreateLeaveTypeMutationBody = BodyType<CreateLeaveTypeRequest>;
export type CreateLeaveTypeMutationError = ErrorType<void>;
/**
 * @summary Create a new leave type
 */
export declare const useCreateLeaveType: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createLeaveType>>, TError, {
        data: BodyType<CreateLeaveTypeRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createLeaveType>>, TError, {
    data: BodyType<CreateLeaveTypeRequest>;
}, TContext>;
/**
 * @summary Update a leave type
 */
export declare const getUpdateLeaveTypeUrl: (id: number) => string;
export declare const updateLeaveType: (id: number, updateLeaveTypeRequest: UpdateLeaveTypeRequest, options?: RequestInit) => Promise<LeaveType>;
export declare const getUpdateLeaveTypeMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateLeaveType>>, TError, {
        id: number;
        data: BodyType<UpdateLeaveTypeRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateLeaveType>>, TError, {
    id: number;
    data: BodyType<UpdateLeaveTypeRequest>;
}, TContext>;
export type UpdateLeaveTypeMutationResult = NonNullable<Awaited<ReturnType<typeof updateLeaveType>>>;
export type UpdateLeaveTypeMutationBody = BodyType<UpdateLeaveTypeRequest>;
export type UpdateLeaveTypeMutationError = ErrorType<void>;
/**
 * @summary Update a leave type
 */
export declare const useUpdateLeaveType: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateLeaveType>>, TError, {
        id: number;
        data: BodyType<UpdateLeaveTypeRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateLeaveType>>, TError, {
    id: number;
    data: BodyType<UpdateLeaveTypeRequest>;
}, TContext>;
/**
 * @summary Delete a leave type
 */
export declare const getDeleteLeaveTypeUrl: (id: number) => string;
export declare const deleteLeaveType: (id: number, options?: RequestInit) => Promise<OkResponse>;
export declare const getDeleteLeaveTypeMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteLeaveType>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteLeaveType>>, TError, {
    id: number;
}, TContext>;
export type DeleteLeaveTypeMutationResult = NonNullable<Awaited<ReturnType<typeof deleteLeaveType>>>;
export type DeleteLeaveTypeMutationError = ErrorType<void>;
/**
 * @summary Delete a leave type
 */
export declare const useDeleteLeaveType: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteLeaveType>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteLeaveType>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary List leave requests with filters
 */
export declare const getListLeaveRequestsUrl: (params?: ListLeaveRequestsParams) => string;
export declare const listLeaveRequests: (params?: ListLeaveRequestsParams, options?: RequestInit) => Promise<LeaveRequestListResponse>;
export declare const getListLeaveRequestsQueryKey: (params?: ListLeaveRequestsParams) => readonly ["/api/leave-requests", ...ListLeaveRequestsParams[]];
export declare const getListLeaveRequestsQueryOptions: <TData = Awaited<ReturnType<typeof listLeaveRequests>>, TError = ErrorType<void>>(params?: ListLeaveRequestsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listLeaveRequests>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listLeaveRequests>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListLeaveRequestsQueryResult = NonNullable<Awaited<ReturnType<typeof listLeaveRequests>>>;
export type ListLeaveRequestsQueryError = ErrorType<void>;
/**
 * @summary List leave requests with filters
 */
export declare function useListLeaveRequests<TData = Awaited<ReturnType<typeof listLeaveRequests>>, TError = ErrorType<void>>(params?: ListLeaveRequestsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listLeaveRequests>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Submit a new leave request
 */
export declare const getCreateLeaveRequestUrl: () => string;
export declare const createLeaveRequest: (createLeaveRequestBody: CreateLeaveRequestBody, options?: RequestInit) => Promise<LeaveRequest>;
export declare const getCreateLeaveRequestMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createLeaveRequest>>, TError, {
        data: BodyType<CreateLeaveRequestBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createLeaveRequest>>, TError, {
    data: BodyType<CreateLeaveRequestBody>;
}, TContext>;
export type CreateLeaveRequestMutationResult = NonNullable<Awaited<ReturnType<typeof createLeaveRequest>>>;
export type CreateLeaveRequestMutationBody = BodyType<CreateLeaveRequestBody>;
export type CreateLeaveRequestMutationError = ErrorType<void>;
/**
 * @summary Submit a new leave request
 */
export declare const useCreateLeaveRequest: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createLeaveRequest>>, TError, {
        data: BodyType<CreateLeaveRequestBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createLeaveRequest>>, TError, {
    data: BodyType<CreateLeaveRequestBody>;
}, TContext>;
/**
 * @summary Update a pending leave request
 */
export declare const getUpdateLeaveRequestUrl: (id: number) => string;
export declare const updateLeaveRequest: (id: number, updateLeaveRequestBody: UpdateLeaveRequestBody, options?: RequestInit) => Promise<LeaveRequest>;
export declare const getUpdateLeaveRequestMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateLeaveRequest>>, TError, {
        id: number;
        data: BodyType<UpdateLeaveRequestBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateLeaveRequest>>, TError, {
    id: number;
    data: BodyType<UpdateLeaveRequestBody>;
}, TContext>;
export type UpdateLeaveRequestMutationResult = NonNullable<Awaited<ReturnType<typeof updateLeaveRequest>>>;
export type UpdateLeaveRequestMutationBody = BodyType<UpdateLeaveRequestBody>;
export type UpdateLeaveRequestMutationError = ErrorType<void>;
/**
 * @summary Update a pending leave request
 */
export declare const useUpdateLeaveRequest: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateLeaveRequest>>, TError, {
        id: number;
        data: BodyType<UpdateLeaveRequestBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateLeaveRequest>>, TError, {
    id: number;
    data: BodyType<UpdateLeaveRequestBody>;
}, TContext>;
/**
 * @summary Delete a leave request
 */
export declare const getDeleteLeaveRequestUrl: (id: number) => string;
export declare const deleteLeaveRequest: (id: number, options?: RequestInit) => Promise<OkResponse>;
export declare const getDeleteLeaveRequestMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteLeaveRequest>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteLeaveRequest>>, TError, {
    id: number;
}, TContext>;
export type DeleteLeaveRequestMutationResult = NonNullable<Awaited<ReturnType<typeof deleteLeaveRequest>>>;
export type DeleteLeaveRequestMutationError = ErrorType<void>;
/**
 * @summary Delete a leave request
 */
export declare const useDeleteLeaveRequest: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteLeaveRequest>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteLeaveRequest>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Approve a leave request
 */
export declare const getApproveLeaveRequestUrl: (id: number) => string;
export declare const approveLeaveRequest: (id: number, approveLeaveRequestBody: ApproveLeaveRequestBody, options?: RequestInit) => Promise<LeaveRequest>;
export declare const getApproveLeaveRequestMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof approveLeaveRequest>>, TError, {
        id: number;
        data: BodyType<ApproveLeaveRequestBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof approveLeaveRequest>>, TError, {
    id: number;
    data: BodyType<ApproveLeaveRequestBody>;
}, TContext>;
export type ApproveLeaveRequestMutationResult = NonNullable<Awaited<ReturnType<typeof approveLeaveRequest>>>;
export type ApproveLeaveRequestMutationBody = BodyType<ApproveLeaveRequestBody>;
export type ApproveLeaveRequestMutationError = ErrorType<void>;
/**
 * @summary Approve a leave request
 */
export declare const useApproveLeaveRequest: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof approveLeaveRequest>>, TError, {
        id: number;
        data: BodyType<ApproveLeaveRequestBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof approveLeaveRequest>>, TError, {
    id: number;
    data: BodyType<ApproveLeaveRequestBody>;
}, TContext>;
/**
 * @summary Reject a leave request
 */
export declare const getRejectLeaveRequestUrl: (id: number) => string;
export declare const rejectLeaveRequest: (id: number, rejectLeaveRequestBody: RejectLeaveRequestBody, options?: RequestInit) => Promise<LeaveRequest>;
export declare const getRejectLeaveRequestMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof rejectLeaveRequest>>, TError, {
        id: number;
        data: BodyType<RejectLeaveRequestBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof rejectLeaveRequest>>, TError, {
    id: number;
    data: BodyType<RejectLeaveRequestBody>;
}, TContext>;
export type RejectLeaveRequestMutationResult = NonNullable<Awaited<ReturnType<typeof rejectLeaveRequest>>>;
export type RejectLeaveRequestMutationBody = BodyType<RejectLeaveRequestBody>;
export type RejectLeaveRequestMutationError = ErrorType<void>;
/**
 * @summary Reject a leave request
 */
export declare const useRejectLeaveRequest: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof rejectLeaveRequest>>, TError, {
        id: number;
        data: BodyType<RejectLeaveRequestBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof rejectLeaveRequest>>, TError, {
    id: number;
    data: BodyType<RejectLeaveRequestBody>;
}, TContext>;
/**
 * @summary Get leave balances for all employees
 */
export declare const getListLeaveBalancesUrl: (params?: ListLeaveBalancesParams) => string;
export declare const listLeaveBalances: (params?: ListLeaveBalancesParams, options?: RequestInit) => Promise<LeaveBalance[]>;
export declare const getListLeaveBalancesQueryKey: (params?: ListLeaveBalancesParams) => readonly ["/api/leave-balances", ...ListLeaveBalancesParams[]];
export declare const getListLeaveBalancesQueryOptions: <TData = Awaited<ReturnType<typeof listLeaveBalances>>, TError = ErrorType<void>>(params?: ListLeaveBalancesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listLeaveBalances>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listLeaveBalances>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListLeaveBalancesQueryResult = NonNullable<Awaited<ReturnType<typeof listLeaveBalances>>>;
export type ListLeaveBalancesQueryError = ErrorType<void>;
/**
 * @summary Get leave balances for all employees
 */
export declare function useListLeaveBalances<TData = Awaited<ReturnType<typeof listLeaveBalances>>, TError = ErrorType<void>>(params?: ListLeaveBalancesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listLeaveBalances>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List payroll records for a month/year
 */
export declare const getListPayrollUrl: (params: ListPayrollParams) => string;
export declare const listPayroll: (params: ListPayrollParams, options?: RequestInit) => Promise<PayrollRecord[]>;
export declare const getListPayrollQueryKey: (params?: ListPayrollParams) => readonly ["/api/payroll", ...ListPayrollParams[]];
export declare const getListPayrollQueryOptions: <TData = Awaited<ReturnType<typeof listPayroll>>, TError = ErrorType<unknown>>(params: ListPayrollParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPayroll>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listPayroll>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListPayrollQueryResult = NonNullable<Awaited<ReturnType<typeof listPayroll>>>;
export type ListPayrollQueryError = ErrorType<unknown>;
/**
 * @summary List payroll records for a month/year
 */
export declare function useListPayroll<TData = Awaited<ReturnType<typeof listPayroll>>, TError = ErrorType<unknown>>(params: ListPayrollParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPayroll>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Payroll stats for a month/year
 */
export declare const getGetPayrollStatsUrl: (params: GetPayrollStatsParams) => string;
export declare const getPayrollStats: (params: GetPayrollStatsParams, options?: RequestInit) => Promise<PayrollStats>;
export declare const getGetPayrollStatsQueryKey: (params?: GetPayrollStatsParams) => readonly ["/api/payroll/stats", ...GetPayrollStatsParams[]];
export declare const getGetPayrollStatsQueryOptions: <TData = Awaited<ReturnType<typeof getPayrollStats>>, TError = ErrorType<unknown>>(params: GetPayrollStatsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPayrollStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPayrollStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPayrollStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getPayrollStats>>>;
export type GetPayrollStatsQueryError = ErrorType<unknown>;
/**
 * @summary Payroll stats for a month/year
 */
export declare function useGetPayrollStats<TData = Awaited<ReturnType<typeof getPayrollStats>>, TError = ErrorType<unknown>>(params: GetPayrollStatsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPayrollStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Generate payroll for all active employees for a month
 */
export declare const getGeneratePayrollUrl: () => string;
export declare const generatePayroll: (generatePayrollBody: GeneratePayrollBody, options?: RequestInit) => Promise<GeneratePayroll201>;
export declare const getGeneratePayrollMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof generatePayroll>>, TError, {
        data: BodyType<GeneratePayrollBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof generatePayroll>>, TError, {
    data: BodyType<GeneratePayrollBody>;
}, TContext>;
export type GeneratePayrollMutationResult = NonNullable<Awaited<ReturnType<typeof generatePayroll>>>;
export type GeneratePayrollMutationBody = BodyType<GeneratePayrollBody>;
export type GeneratePayrollMutationError = ErrorType<unknown>;
/**
 * @summary Generate payroll for all active employees for a month
 */
export declare const useGeneratePayroll: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof generatePayroll>>, TError, {
        data: BodyType<GeneratePayrollBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof generatePayroll>>, TError, {
    data: BodyType<GeneratePayrollBody>;
}, TContext>;
/**
 * @summary Salary history for a single employee
 */
export declare const getGetEmployeePayrollHistoryUrl: (employeeId: number, params?: GetEmployeePayrollHistoryParams) => string;
export declare const getEmployeePayrollHistory: (employeeId: number, params?: GetEmployeePayrollHistoryParams, options?: RequestInit) => Promise<PayrollRecord[]>;
export declare const getGetEmployeePayrollHistoryQueryKey: (employeeId: number, params?: GetEmployeePayrollHistoryParams) => readonly [`/api/payroll/employee/${number}`, ...GetEmployeePayrollHistoryParams[]];
export declare const getGetEmployeePayrollHistoryQueryOptions: <TData = Awaited<ReturnType<typeof getEmployeePayrollHistory>>, TError = ErrorType<unknown>>(employeeId: number, params?: GetEmployeePayrollHistoryParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEmployeePayrollHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getEmployeePayrollHistory>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetEmployeePayrollHistoryQueryResult = NonNullable<Awaited<ReturnType<typeof getEmployeePayrollHistory>>>;
export type GetEmployeePayrollHistoryQueryError = ErrorType<unknown>;
/**
 * @summary Salary history for a single employee
 */
export declare function useGetEmployeePayrollHistory<TData = Awaited<ReturnType<typeof getEmployeePayrollHistory>>, TError = ErrorType<unknown>>(employeeId: number, params?: GetEmployeePayrollHistoryParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEmployeePayrollHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get a single payroll record
 */
export declare const getGetPayrollRecordUrl: (id: number) => string;
export declare const getPayrollRecord: (id: number, options?: RequestInit) => Promise<PayrollRecord>;
export declare const getGetPayrollRecordQueryKey: (id: number) => readonly [`/api/payroll/${number}`];
export declare const getGetPayrollRecordQueryOptions: <TData = Awaited<ReturnType<typeof getPayrollRecord>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPayrollRecord>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPayrollRecord>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPayrollRecordQueryResult = NonNullable<Awaited<ReturnType<typeof getPayrollRecord>>>;
export type GetPayrollRecordQueryError = ErrorType<unknown>;
/**
 * @summary Get a single payroll record
 */
export declare function useGetPayrollRecord<TData = Awaited<ReturnType<typeof getPayrollRecord>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPayrollRecord>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update bonus, deductions, overtime pay, or note
 */
export declare const getUpdatePayrollRecordUrl: (id: number) => string;
export declare const updatePayrollRecord: (id: number, updatePayrollRecordBody: UpdatePayrollRecordBody, options?: RequestInit) => Promise<PayrollRecord>;
export declare const getUpdatePayrollRecordMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updatePayrollRecord>>, TError, {
        id: number;
        data: BodyType<UpdatePayrollRecordBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updatePayrollRecord>>, TError, {
    id: number;
    data: BodyType<UpdatePayrollRecordBody>;
}, TContext>;
export type UpdatePayrollRecordMutationResult = NonNullable<Awaited<ReturnType<typeof updatePayrollRecord>>>;
export type UpdatePayrollRecordMutationBody = BodyType<UpdatePayrollRecordBody>;
export type UpdatePayrollRecordMutationError = ErrorType<unknown>;
/**
 * @summary Update bonus, deductions, overtime pay, or note
 */
export declare const useUpdatePayrollRecord: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updatePayrollRecord>>, TError, {
        id: number;
        data: BodyType<UpdatePayrollRecordBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updatePayrollRecord>>, TError, {
    id: number;
    data: BodyType<UpdatePayrollRecordBody>;
}, TContext>;
/**
 * @summary Delete a payroll record
 */
export declare const getDeletePayrollRecordUrl: (id: number) => string;
export declare const deletePayrollRecord: (id: number, options?: RequestInit) => Promise<OkResponse>;
export declare const getDeletePayrollRecordMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deletePayrollRecord>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deletePayrollRecord>>, TError, {
    id: number;
}, TContext>;
export type DeletePayrollRecordMutationResult = NonNullable<Awaited<ReturnType<typeof deletePayrollRecord>>>;
export type DeletePayrollRecordMutationError = ErrorType<unknown>;
/**
 * @summary Delete a payroll record
 */
export declare const useDeletePayrollRecord: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deletePayrollRecord>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deletePayrollRecord>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary List all salary grades for the shop
 */
export declare const getListSalaryGradesUrl: () => string;
export declare const listSalaryGrades: (options?: RequestInit) => Promise<SalaryGrade[]>;
export declare const getListSalaryGradesQueryKey: () => readonly ["/api/salary-grades"];
export declare const getListSalaryGradesQueryOptions: <TData = Awaited<ReturnType<typeof listSalaryGrades>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSalaryGrades>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listSalaryGrades>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListSalaryGradesQueryResult = NonNullable<Awaited<ReturnType<typeof listSalaryGrades>>>;
export type ListSalaryGradesQueryError = ErrorType<unknown>;
/**
 * @summary List all salary grades for the shop
 */
export declare function useListSalaryGrades<TData = Awaited<ReturnType<typeof listSalaryGrades>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSalaryGrades>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a new salary grade
 */
export declare const getCreateSalaryGradeUrl: () => string;
export declare const createSalaryGrade: (createSalaryGradeBody: CreateSalaryGradeBody, options?: RequestInit) => Promise<SalaryGrade>;
export declare const getCreateSalaryGradeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createSalaryGrade>>, TError, {
        data: BodyType<CreateSalaryGradeBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createSalaryGrade>>, TError, {
    data: BodyType<CreateSalaryGradeBody>;
}, TContext>;
export type CreateSalaryGradeMutationResult = NonNullable<Awaited<ReturnType<typeof createSalaryGrade>>>;
export type CreateSalaryGradeMutationBody = BodyType<CreateSalaryGradeBody>;
export type CreateSalaryGradeMutationError = ErrorType<unknown>;
/**
 * @summary Create a new salary grade
 */
export declare const useCreateSalaryGrade: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createSalaryGrade>>, TError, {
        data: BodyType<CreateSalaryGradeBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createSalaryGrade>>, TError, {
    data: BodyType<CreateSalaryGradeBody>;
}, TContext>;
/**
 * @summary Get a salary grade by id
 */
export declare const getGetSalaryGradeUrl: (id: number) => string;
export declare const getSalaryGrade: (id: number, options?: RequestInit) => Promise<SalaryGrade>;
export declare const getGetSalaryGradeQueryKey: (id: number) => readonly [`/api/salary-grades/${number}`];
export declare const getGetSalaryGradeQueryOptions: <TData = Awaited<ReturnType<typeof getSalaryGrade>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSalaryGrade>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSalaryGrade>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSalaryGradeQueryResult = NonNullable<Awaited<ReturnType<typeof getSalaryGrade>>>;
export type GetSalaryGradeQueryError = ErrorType<unknown>;
/**
 * @summary Get a salary grade by id
 */
export declare function useGetSalaryGrade<TData = Awaited<ReturnType<typeof getSalaryGrade>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSalaryGrade>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update a salary grade
 */
export declare const getUpdateSalaryGradeUrl: (id: number) => string;
export declare const updateSalaryGrade: (id: number, updateSalaryGradeBody: UpdateSalaryGradeBody, options?: RequestInit) => Promise<SalaryGrade>;
export declare const getUpdateSalaryGradeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSalaryGrade>>, TError, {
        id: number;
        data: BodyType<UpdateSalaryGradeBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateSalaryGrade>>, TError, {
    id: number;
    data: BodyType<UpdateSalaryGradeBody>;
}, TContext>;
export type UpdateSalaryGradeMutationResult = NonNullable<Awaited<ReturnType<typeof updateSalaryGrade>>>;
export type UpdateSalaryGradeMutationBody = BodyType<UpdateSalaryGradeBody>;
export type UpdateSalaryGradeMutationError = ErrorType<unknown>;
/**
 * @summary Update a salary grade
 */
export declare const useUpdateSalaryGrade: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSalaryGrade>>, TError, {
        id: number;
        data: BodyType<UpdateSalaryGradeBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateSalaryGrade>>, TError, {
    id: number;
    data: BodyType<UpdateSalaryGradeBody>;
}, TContext>;
/**
 * @summary Delete a salary grade
 */
export declare const getDeleteSalaryGradeUrl: (id: number) => string;
export declare const deleteSalaryGrade: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteSalaryGradeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteSalaryGrade>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteSalaryGrade>>, TError, {
    id: number;
}, TContext>;
export type DeleteSalaryGradeMutationResult = NonNullable<Awaited<ReturnType<typeof deleteSalaryGrade>>>;
export type DeleteSalaryGradeMutationError = ErrorType<unknown>;
/**
 * @summary Delete a salary grade
 */
export declare const useDeleteSalaryGrade: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteSalaryGrade>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteSalaryGrade>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Mark a payroll record as paid
 */
export declare const getMarkPayrollPaidUrl: (id: number) => string;
export declare const markPayrollPaid: (id: number, markPayrollPaidBody: MarkPayrollPaidBody, options?: RequestInit) => Promise<PayrollRecord>;
export declare const getMarkPayrollPaidMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof markPayrollPaid>>, TError, {
        id: number;
        data: BodyType<MarkPayrollPaidBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof markPayrollPaid>>, TError, {
    id: number;
    data: BodyType<MarkPayrollPaidBody>;
}, TContext>;
export type MarkPayrollPaidMutationResult = NonNullable<Awaited<ReturnType<typeof markPayrollPaid>>>;
export type MarkPayrollPaidMutationBody = BodyType<MarkPayrollPaidBody>;
export type MarkPayrollPaidMutationError = ErrorType<unknown>;
/**
 * @summary Mark a payroll record as paid
 */
export declare const useMarkPayrollPaid: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof markPayrollPaid>>, TError, {
        id: number;
        data: BodyType<MarkPayrollPaidBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof markPayrollPaid>>, TError, {
    id: number;
    data: BodyType<MarkPayrollPaidBody>;
}, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map