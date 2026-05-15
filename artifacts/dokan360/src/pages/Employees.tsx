import { useState, useMemo, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/hooks/useLocale";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch, getListShopUsersQueryKey, useListShifts, getGetWeeklyScheduleQueryKey } from "@workspace/api-client-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  Phone,
  Mail,
  Briefcase,
  Calendar,
  DollarSign,
  UserCheck,
  UserX,
  Filter,
  Upload,
  FileText,
  ImageIcon,
  Download,
  X,
  FileCheck2,
  Eye,
  Monitor,
  Lock,
  UserPlus,
  ShieldCheck,
  ShoppingBag,
  Loader2,
  ChevronDown,
  ChevronUp,
  Camera,
  MoreVertical,
  GraduationCap,
  CalendarDays,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* ─── Types ───────────────────────────────────────────────────── */
type EmployeeStatus = "active" | "inactive" | "suspended" | "resigned";
type EmployeeGender = "male" | "female" | "other";
type BloodGroup = "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-";
type DayState = "shift" | "off" | "none";
type WeeklyEntry = { id: number; weekday: number | null; shiftId: number | null };
const DEFAULT_NEW_DAYS: DayState[] = ["off","shift","shift","shift","shift","shift","off"];
const DEFAULT_EDIT_DAYS: DayState[] = ["none","none","none","none","none","none","none"];

type Employee = {
  id: number;
  employeeCode?: string | null;
  name: string;
  fatherName?: string | null;
  motherName?: string | null;
  phone?: string | null;
  emergencyContact?: string | null;
  email?: string | null;
  address?: string | null;
  nidNumber?: string | null;
  dateOfBirth?: string | null;
  gender?: EmployeeGender | null;
  joiningDate?: string | null;
  bloodGroup?: BloodGroup | null;
  salary?: number | null;
  salaryGradeId?: number | null;
  status: EmployeeStatus;
  department?: string | null;
  designation?: string | null;
  userId?: number | null;
  hasSystemAccess: boolean;
  systemRole?: string | null;
  systemRoleLabel?: string | null;
  isSystemOnly: boolean;
  photo?: string | null;
  nidDocPath?: string | null;
  cvPath?: string | null;
  contractPath?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

type EmployeeStats = {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  resigned: number;
  totalSalary: number;
  departments: string[];
  designations: string[];
};

type EmployeeForm = {
  name: string;
  employeeCode: string;
  fatherName: string;
  motherName: string;
  phone: string;
  emergencyContact: string;
  email: string;
  address: string;
  nidNumber: string;
  dateOfBirth: string;
  gender: string;
  joiningDate: string;
  bloodGroup: string;
  salary: string;
  salaryGradeId: string;
  status: string;
  department: string;
  designation: string;
  notes: string;
  photo: string;
  nidDocPath: string;
  cvPath: string;
  contractPath: string;
};

const EMPTY_FORM: EmployeeForm = {
  name: "", employeeCode: "", fatherName: "", motherName: "",
  phone: "", emergencyContact: "", email: "", address: "",
  nidNumber: "", dateOfBirth: "", gender: "", joiningDate: "",
  bloodGroup: "", salary: "", salaryGradeId: "", status: "active", department: "",
  designation: "", notes: "", photo: "", nidDocPath: "", cvPath: "", contractPath: "",
};

const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const STATUS_LIST: EmployeeStatus[] = ["active", "inactive", "suspended", "resigned"];

/* ─── Query keys ─────────────────────────────────────────────── */
const EMPLOYEES_KEY = ["employees"];
const STATS_KEY = ["employees", "stats"];

/* ─── API helpers ────────────────────────────────────────────── */
async function fetchEmployees(params?: Record<string, string>) {
  const qs = params && Object.keys(params).length > 0 ? "?" + new URLSearchParams(params).toString() : "";
  return customFetch<Employee[]>(`/api/employees${qs}`);
}
async function fetchStats() {
  return customFetch<EmployeeStats>("/api/employees/stats");
}
async function apiCreateEmployee(data: object) {
  return customFetch<Employee>("/api/employees", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
}
async function apiUpdateEmployee(id: number, data: object) {
  return customFetch<Employee>(`/api/employees/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
}
async function apiDeleteEmployee(id: number) {
  return customFetch<void>(`/api/employees/${id}`, { method: "DELETE" });
}
async function apiGrantAccess(id: number, data: { email: string; password: string; role: string }) {
  return customFetch<Employee>(`/api/employees/${id}/grant-access`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
}
async function apiRevokeAccess(id: number) {
  return customFetch<Employee>(`/api/employees/${id}/revoke-access`, { method: "DELETE" });
}
async function fetchNextEmployeeCode(): Promise<string> {
  const res = await customFetch<{ code: string }>("/api/employees/next-code");
  return res.code;
}

type SalaryGradeOption = { id: number; name: string; isDefault: boolean };
async function fetchSalaryGrades(): Promise<SalaryGradeOption[]> {
  return customFetch<SalaryGradeOption[]>("/api/salary-grades");
}

type DutyScheduleDto = {
  id: number;
  shiftId: number | null;
  shiftName: string | null;
  shiftNameBn: string | null;
  shiftStartTime: string | null;
  shiftEndTime: string | null;
  shiftColor: string | null;
  type: string;
  weekday: number | null;
};

async function apiCreateScheduleEntry(data: {
  employeeId: number;
  shiftId: number;
  type: "weekly";
  weekday: number;
}) {
  return customFetch<void>("/api/schedules", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
}

async function apiDeleteScheduleEntry(id: number) {
  return customFetch<void>(`/api/schedules/${id}`, { method: "DELETE" });
}

async function apiUpdateScheduleEntry(id: number, shiftId: number) {
  return customFetch<void>(`/api/schedules/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ shiftId }),
    headers: { "Content-Type": "application/json" },
  });
}

async function fetchEmployeeWeeklySchedule(employeeId: number): Promise<DutyScheduleDto[]> {
  return customFetch<DutyScheduleDto[]>(`/api/schedules?employeeId=${employeeId}&type=weekly`);
}

type UserRoleOption = {
  id: string;
  label: string;
  baseRole: string;
  isBuiltin: boolean;
};
async function fetchUserRoles(): Promise<UserRoleOption[]> {
  return customFetch<UserRoleOption[]>("/api/user-roles");
}

const FALLBACK_ROLE_LABELS: Record<string, string> = {
  admin:             "Shop Admin",
  seller:            "Seller",
  viewer:            "Viewer",
  super_admin:       "Super Admin",
  shop_admin:        "Shop Admin",
  manager:           "Manager",
  accountant:        "Accountant",
  hr_manager:        "HR Manager",
  inventory_manager: "Inventory Manager",
  sales_manager:     "Sales Manager",
  cashier:           "Cashier",
};

function getRoleDisplayLabel(systemRole: string | null, userRoles?: UserRoleOption[]): string {
  if (!systemRole) return "";
  if (userRoles && userRoles.length > 0) {
    const match = userRoles.find((r) => r.id === systemRole || r.baseRole === systemRole);
    if (match) return match.label;
  }
  return FALLBACK_ROLE_LABELS[systemRole] ?? systemRole;
}

/* ─── Storage helpers ────────────────────────────────────────── */
const BUCKET = "employee-docs";

async function uploadDocToStorage(file: File, shopId: number, docType: string): Promise<string> {
  const ext = file.name.split(".").pop() ?? "bin";
  const uuid = crypto.randomUUID();
  const path = `${shopId}/${docType}/${uuid}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return path;
}

async function getSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

async function deleteFromStorage(path: string) {
  await supabase.storage.from(BUCKET).remove([path]);
}

/* ─── StoragePhoto — renders a signed-URL image from a storage path */
function StoragePhoto({
  path,
  fallback,
}: {
  path: string;
  fallback: React.ReactNode;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    getSignedUrl(path).then((u) => { if (alive) setUrl(u); });
    return () => { alive = false; };
  }, [path]);
  if (url) return <img src={url} alt="" className="w-full h-full object-cover" />;
  return <>{fallback}</>;
}

/* ─── DocUploader component ──────────────────────────────────── */
type DocType = "photo" | "nid" | "cv" | "contract";

function DocUploader({
  label,
  accept,
  currentPath,
  docType,
  shopId,
  onUploaded,
  onRemoved,
}: {
  label: string;
  accept: string;
  currentPath: string;
  docType: DocType;
  shopId: number;
  onUploaded: (path: string) => void;
  onRemoved: () => void;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: t("employees.docs.fileTooLarge"), variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      if (currentPath) await deleteFromStorage(currentPath);
      const path = await uploadDocToStorage(file, shopId, docType);
      onUploaded(path);
      toast({ title: t("employees.docs.uploaded") });
    } catch {
      toast({ title: t("employees.docs.uploadFailed"), variant: "destructive" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleView() {
    if (!currentPath) return;
    try {
      const url = downloadUrl ?? await getSignedUrl(currentPath);
      if (url) {
        setDownloadUrl(url);
        window.open(url, "_blank", "noopener");
      }
    } catch {
      toast({ title: t("employees.docs.viewFailed"), variant: "destructive" });
    }
  }

  function handleRemove() {
    if (currentPath) deleteFromStorage(currentPath);
    onRemoved();
    setDownloadUrl(null);
  }

  const hasFile = Boolean(currentPath);
  const fileName = currentPath ? currentPath.split("/").pop() ?? currentPath : null;
  const isImage = accept.includes("image");

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5">
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${hasFile ? "bg-primary/12" : "bg-muted"}`}>
        {isImage
          ? <ImageIcon className={`h-4 w-4 ${hasFile ? "text-primary" : "text-muted-foreground"}`} />
          : <FileText className={`h-4 w-4 ${hasFile ? "text-primary" : "text-muted-foreground"}`} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground leading-tight">{label}</p>
        {hasFile
          ? <p className="text-xs text-muted-foreground truncate">{fileName}</p>
          : <p className="text-xs text-muted-foreground">{t("employees.docs.noFile")}</p>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {hasFile && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg"
              onClick={handleView}
              title={t("employees.docs.view")}
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleRemove}
              title={t("employees.docs.remove")}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          title={hasFile ? t("employees.docs.replace") : t("employees.docs.upload")}
        >
          {uploading
            ? <span className="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            : <Upload className="h-3.5 w-3.5" />}
        </Button>
      </div>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFile} />
    </div>
  );
}

/* ─── Status badge ───────────────────────────────────────────── */
function StatusBadge({ status }: { status: EmployeeStatus }) {
  const { t } = useTranslation();
  const map: Record<EmployeeStatus, { label: string; className: string }> = {
    active:    { label: t("employees.statusActive"),    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" },
    inactive:  { label: t("employees.statusInactive"),  className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
    suspended: { label: t("employees.statusSuspended"), className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" },
    resigned:  { label: t("employees.statusResigned"),  className: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400" },
  };
  const { label, className } = map[status] ?? map.active;
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>{label}</span>;
}

/* ─── Stat card ──────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, accent, iconColor }: {
  icon: React.ElementType; label: string; value: string | number;
  accent: string; iconColor: string;
}) {
  return (
    <motion.div variants={fadeInUp} whileHover={{ y: -2, transition: { duration: 0.15 } }}>
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3.5 shadow-sm cursor-default">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold tabular-nums text-foreground leading-tight">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Section header ─────────────────────────────────────────── */
function SectionHeader({ icon: Icon, label, accent, iconColor }: {
  icon: React.ElementType; label: string; accent: string; iconColor: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl mb-3 ${accent}`}>
      <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
      <span className={`text-xs font-bold uppercase tracking-wider ${iconColor}`}>{label}</span>
    </div>
  );
}

/* ─── Employee form dialog ───────────────────────────────────── */
function EmployeeFormDialog({
  open, onClose, employee,
}: {
  open: boolean; onClose: () => void; employee?: Employee | null;
}) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();
  const shopId = user?.shopId ?? 0;

  const isNew = !employee;

  /* Auto-fetch next serial code for new employees */
  const { data: nextCode, isLoading: nextCodeLoading } = useQuery({
    queryKey: ["employees", "next-code"],
    queryFn:  fetchNextEmployeeCode,
    enabled:  isNew,
    staleTime: 0,
  });

  /* Fetch user roles for designation dropdown */
  const { data: userRoles = [] } = useQuery({
    queryKey: ["user-roles"],
    queryFn:  fetchUserRoles,
    staleTime: 5 * 60 * 1000,
  });

  /* Fetch salary grades for grade dropdown */
  const { data: salaryGrades = [] } = useQuery({
    queryKey: ["salary-grades"],
    queryFn:  fetchSalaryGrades,
    staleTime: 5 * 60 * 1000,
  });

  /* Fetch active shifts for default shift dropdown (new employee only) */
  const { data: availableShifts = [] } = useListShifts();

  /* Fetch existing weekly schedule when editing an employee */
  const { data: existingSchedule = [], refetch: refetchSchedule } = useQuery({
    queryKey: ["schedules", "weekly", employee?.id],
    queryFn: () => fetchEmployeeWeeklySchedule(employee!.id),
    enabled: !isNew && !!employee?.id && open,
    staleTime: 0,
  });

  /* Build weekday → DutyScheduleDto map from fetched data */
  const editScheduleMap = useMemo<Map<number, DutyScheduleDto>>(() => {
    const m = new Map<number, DutyScheduleDto>();
    for (const s of existingSchedule) {
      if (s.weekday !== null) m.set(s.weekday, s);
    }
    return m;
  }, [existingSchedule]);

  const [scheduleUpdating, setScheduleUpdating] = useState<Record<number, boolean>>({});

  async function handleScheduleChange(weekday: number, currentEntry: DutyScheduleDto | undefined, value: string) {
    setScheduleUpdating((prev) => ({ ...prev, [weekday]: true }));
    try {
      if (value === "__off__") {
        /* Remove assignment for this day */
        if (currentEntry) await apiDeleteScheduleEntry(currentEntry.id);
      } else {
        const shiftId = Number(value);
        if (currentEntry) {
          await apiUpdateScheduleEntry(currentEntry.id, shiftId);
        } else {
          await apiCreateScheduleEntry({ employeeId: employee!.id, shiftId, type: "weekly", weekday });
        }
      }
      await refetchSchedule();
      qc.invalidateQueries({ queryKey: getGetWeeklyScheduleQueryKey() });
    } catch {
      toast({ title: t("employees.scheduleUpdateFailed"), variant: "destructive" });
    } finally {
      setScheduleUpdating((prev) => ({ ...prev, [weekday]: false }));
    }
  }

  const [form, setForm] = useState<EmployeeForm>(EMPTY_FORM);
  const [defaultShiftId, setDefaultShiftId] = useState<string>("");

  /* POS access state — create mode */
  const [posAccess, setPosAccess] = useState(false);
  const [posEmail, setPosEmail]   = useState("");
  const [posPassword, setPosPassword] = useState("");
  const [posRole, setPosRole]     = useState("seller");
  const [saving, setSaving]       = useState(false);

  /* POS access state — edit mode (grant) */
  const [grantOpen, setGrantOpen]         = useState(false);
  const [grantEmail, setGrantEmail]       = useState("");
  const [grantPassword, setGrantPassword] = useState("");
  const [grantRole, setGrantRole]         = useState("seller");
  const [accessBusy, setAccessBusy]       = useState(false);

  /* Avatar photo preview */
  const [photoUrl, setPhotoUrl]           = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  /**
   * Reset all form state every time the dialog opens.
   * EmployeeFormDialog is always mounted (never conditionally rendered),
   * so useState initial value runs only once. We must imperatively sync
   * form state whenever `open` transitions to true or `employee` changes.
   */
  useEffect(() => {
    if (!open) return;
    if (employee) {
      setForm({
        name:             employee.name,
        employeeCode:     employee.employeeCode ?? "",
        fatherName:       employee.fatherName ?? "",
        motherName:       employee.motherName ?? "",
        phone:            employee.phone ?? "",
        emergencyContact: employee.emergencyContact ?? "",
        email:            employee.email ?? "",
        address:          employee.address ?? "",
        nidNumber:        employee.nidNumber ?? "",
        dateOfBirth:      employee.dateOfBirth ?? "",
        gender:           employee.gender ?? "",
        joiningDate:      employee.joiningDate ?? "",
        bloodGroup:       employee.bloodGroup ?? "",
        salary:           employee.salary !== null && employee.salary !== undefined ? String(employee.salary) : "",
        salaryGradeId:    employee.salaryGradeId !== null && employee.salaryGradeId !== undefined ? String(employee.salaryGradeId) : "",
        status:           employee.status,
        department:       employee.department ?? "",
        designation:      employee.designation ?? "",
        notes:            employee.notes ?? "",
        photo:            employee.photo ?? "",
        nidDocPath:       employee.nidDocPath ?? "",
        cvPath:           employee.cvPath ?? "",
        contractPath:     employee.contractPath ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
      setDefaultShiftId("");
      setPosAccess(false);
      setPosEmail("");
      setPosPassword("");
      setPosRole("seller");
      setGrantOpen(false);
      setGrantEmail("");
      setGrantPassword("");
      setGrantRole("seller");
      setPhotoUrl(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, employee?.id]);

  /* Pre-fill auto-generated code once fetched (new mode only) */
  useEffect(() => {
    if (isNew && nextCode) {
      setForm((f) => ({ ...f, employeeCode: nextCode }));
    }
  }, [isNew, nextCode]);

  /* Pre-fill designation from linked user's system role (edit mode) */
  useEffect(() => {
    if (!open || !employee?.hasSystemAccess || !employee.systemRole) return;
    const label = employee.systemRoleLabel ?? getRoleDisplayLabel(employee.systemRole, userRoles);
    if (label) setForm((f) => ({ ...f, designation: f.designation || label }));
  }, [open, employee?.id, userRoles]);

  useEffect(() => {
    if (form.photo) {
      getSignedUrl(form.photo).then(setPhotoUrl);
    } else {
      setPhotoUrl(null);
    }
  }, [form.photo]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: t("employees.docs.fileTooLarge"), variant: "destructive" }); return;
    }
    setAvatarUploading(true);
    try {
      if (form.photo) await deleteFromStorage(form.photo);
      const path = await uploadDocToStorage(file, shopId, "photo");
      set("photo")(path);
      const url = await getSignedUrl(path);
      setPhotoUrl(url);
      toast({ title: t("employees.docs.uploaded") });
    } catch {
      toast({ title: t("employees.docs.uploadFailed"), variant: "destructive" });
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  const set = (k: keyof EmployeeForm) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const onInput = (k: keyof EmployeeForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k)(e.target.value);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: EMPLOYEES_KEY });
    qc.invalidateQueries({ queryKey: STATS_KEY });
  };

  const createMut = useMutation({ mutationFn: (data: object) => apiCreateEmployee(data) });
  const updateMut = useMutation({ mutationFn: ({ id, data }: { id: number; data: object }) => apiUpdateEmployee(id, data) });

  function buildPayload() {
    return {
      name:             form.name.trim(),
      employeeCode:     form.employeeCode.trim() || null,
      fatherName:       form.fatherName.trim() || null,
      motherName:       form.motherName.trim() || null,
      phone:            form.phone.trim() || null,
      emergencyContact: form.emergencyContact.trim() || null,
      email:            form.email.trim() || null,
      address:          form.address.trim() || null,
      nidNumber:        form.nidNumber.trim() || null,
      dateOfBirth:      form.dateOfBirth || null,
      gender:           form.gender || null,
      joiningDate:      form.joiningDate || null,
      bloodGroup:       form.bloodGroup || null,
      salary:           form.salary ? parseFloat(form.salary) : null,
      salaryGradeId:    form.salaryGradeId ? Number(form.salaryGradeId) : null,
      status:           form.status || "active",
      department:       form.department.trim() || null,
      designation:      form.designation.trim() || null,
      notes:            form.notes.trim() || null,
      photo:            form.photo || null,
      nidDocPath:       form.nidDocPath || null,
      cvPath:           form.cvPath || null,
      contractPath:     form.contractPath || null,
    };
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast({ title: t("employees.nameRequired"), variant: "destructive" }); return;
    }
    const isSystemOnly = employee?.isSystemOnly === true;
    const isCreate = !employee || isSystemOnly;

    if (posAccess && isCreate && !isSystemOnly) {
      if (!posEmail.trim()) {
        toast({ title: t("employees.posEmailRequired"), variant: "destructive" }); return;
      }
      if (posPassword.length < 6) {
        toast({ title: t("employees.posPasswordMin"), variant: "destructive" }); return;
      }
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (!isCreate) {
        /* Regular employee update */
        await updateMut.mutateAsync({ id: employee!.id, data: payload });
        toast({ title: t("employees.updated") });
      } else if (isSystemOnly && employee) {
        /* System-only user → create a new employee record linked to existing user */
        await createMut.mutateAsync({ ...payload, linkUserId: employee.userId });
        toast({ title: t("employees.created") });
      } else {
        /* Brand-new employee (optionally with POS access) */
        const fullPayload = posAccess
          ? { ...payload, posAccess: { email: posEmail.trim(), password: posPassword, role: posRole } }
          : payload;
        const created = await createMut.mutateAsync(fullPayload);
        /* Auto-assign default shift Mon–Fri if selected */
        if (defaultShiftId && created.id) {
          await Promise.allSettled(
            [1, 2, 3, 4, 5].map((weekday) =>
              apiCreateScheduleEntry({
                employeeId: created.id,
                shiftId:    Number(defaultShiftId),
                type:       "weekly",
                weekday,
              }),
            ),
          );
          qc.invalidateQueries({ queryKey: getGetWeeklyScheduleQueryKey() });
        }
        if (posAccess) {
          qc.invalidateQueries({ queryKey: getListShopUsersQueryKey() });
          toast({ title: t("employees.posUserCreated") });
        } else {
          toast({ title: t("employees.created") });
        }
      }
      invalidate();
      onClose();
    } catch {
      toast({ title: t("employees.saveFailed"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleGrantAccess() {
    if (!employee) return;
    if (!grantEmail.trim()) {
      toast({ title: t("employees.posEmailRequired"), variant: "destructive" }); return;
    }
    if (grantPassword.length < 6) {
      toast({ title: t("employees.posPasswordMin"), variant: "destructive" }); return;
    }
    setAccessBusy(true);
    try {
      await apiGrantAccess(employee.id, { email: grantEmail.trim(), password: grantPassword, role: grantRole });
      qc.invalidateQueries({ queryKey: getListShopUsersQueryKey() });
      invalidate();
      toast({ title: t("employees.grantAccessSuccess") });
      onClose();
    } catch {
      toast({ title: t("employees.grantAccessFailed"), variant: "destructive" });
    } finally {
      setAccessBusy(false);
    }
  }

  async function handleRevokeAccess() {
    if (!employee) return;
    setAccessBusy(true);
    try {
      await apiRevokeAccess(employee.id);
      qc.invalidateQueries({ queryKey: getListShopUsersQueryKey() });
      invalidate();
      toast({ title: t("employees.revokeAccessSuccess") });
      onClose();
    } catch {
      toast({ title: t("employees.revokeAccessFailed"), variant: "destructive" });
    } finally {
      setAccessBusy(false);
    }
  }

  const fi = (label: string, key: keyof EmployeeForm, placeholder?: string, type = "text") => (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Input className="h-10 rounded-xl border-border/70 text-sm" type={type}
        value={form[key]} onChange={onInput(key)} placeholder={placeholder} />
    </div>
  );

  const roleIcons: Record<string, React.ElementType> = {
    admin: ShieldCheck, seller: ShoppingBag, viewer: Eye,
  };
  const RoleIcon = roleIcons[posRole] ?? ShoppingBag;

  const avatarLetter = form.name ? form.name.trim()[0]?.toUpperCase() : "?";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-2xl max-w-2xl max-h-[92vh] overflow-hidden p-0 gap-0 flex flex-col">

        {/* ── Sticky header ───────────────────────────────────── */}
        <div className="shrink-0 bg-card border-b border-border/50 px-5 py-3.5 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${employee ? "bg-amber-500/12" : "bg-primary/12"}`}>
              {employee
                ? <Pencil className="h-4 w-4 text-amber-600" />
                : <UserPlus className="h-4 w-4 text-primary" />}
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-sm font-bold leading-tight">
                {employee ? t("employees.edit") : t("employees.add")}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {employee ? employee.name : t("employees.addSubtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* ── Body: left avatar panel + right scrollable form ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Left avatar panel */}
          <div className="hidden sm:flex w-44 flex-col items-center gap-4 pt-7 pb-5 px-3 border-r border-border/40 bg-gradient-to-b from-muted/40 via-muted/20 to-transparent shrink-0">

            {/* Circular avatar */}
            <div className="relative group">
              <div className="h-28 w-28 rounded-full border-4 border-background shadow-lg overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                {photoUrl
                  ? <img src={photoUrl} alt="avatar" className="w-full h-full object-cover" />
                  : <span className="text-3xl font-extrabold text-primary/70 select-none">{avatarLetter}</span>
                }
              </div>
              {/* Upload overlay on hover */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer"
              >
                {avatarUploading
                  ? <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Camera className="h-5 w-5 text-white" />
                }
                <span className="text-[10px] font-semibold text-white leading-tight">{t("employees.docs.photo")}</span>
              </button>
              <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} />
            </div>

            {/* Upload hint */}
            <p className="text-[10px] text-muted-foreground text-center leading-relaxed px-1">
              {t("employees.avatarHint")}
            </p>

            {/* Status pill */}
            <StatusBadge status={(form.status || "active") as EmployeeStatus} />

            {/* Employee code */}
            {form.employeeCode && (
              <div className="text-center mt-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("employees.employeeCode")}</p>
                <p className="text-xs font-mono font-bold text-foreground mt-0.5">{form.employeeCode}</p>
              </div>
            )}

            {/* Department */}
            {form.department && (
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("employees.department")}</p>
                <p className="text-xs font-semibold text-foreground mt-0.5 break-words">{form.department}</p>
              </div>
            )}

            {/* Salary */}
            {form.salary && (
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("employees.salary")}</p>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">৳{form.salary}</p>
              </div>
            )}
          </div>

          {/* Right scrollable form */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 min-w-0">

            {/* ── Section 1: Job Info ──────────────────────────── */}
            <div>
              <SectionHeader icon={Briefcase} label={t("employees.sectionBasic")} accent="bg-amber-500/8" iconColor="text-amber-600" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-medium text-muted-foreground">{t("employees.name")} <span className="text-destructive">*</span></Label>
                  <Input className="h-10 rounded-xl border-border/70 text-sm font-medium"
                    value={form.name} onChange={onInput("name")} placeholder={t("employees.namePlaceholder")} />
                </div>
                {/* Default Shift — new employee only, shown prominently at top */}
                {isNew && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">{t("employees.defaultShift")}</Label>
                      <span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                        {t("common.optional")}
                      </span>
                    </div>
                    <Select
                      value={defaultShiftId || "__none__"}
                      onValueChange={(v) => setDefaultShiftId(v === "__none__" ? "" : v)}
                    >
                      <SelectTrigger className="h-10 rounded-xl border-border/70 text-sm">
                        <SelectValue placeholder={t("employees.noShift")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">{t("employees.noShift")}</SelectItem>
                        {availableShifts.filter((s) => s.isActive).map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.nameBn} ({s.startTime}–{s.endTime})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {defaultShiftId && (
                      <p className="text-xs text-muted-foreground">{t("employees.defaultShiftDesc")}</p>
                    )}
                  </div>
                )}
                {/* Employee ID — auto-generated, locked */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">{t("employees.employeeCode")}</Label>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-semibold">
                      <Lock className="h-2.5 w-2.5" />
                      {t("employees.employeeCodeAutoHint")}
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      className="h-10 rounded-xl border-border/70 text-sm font-mono bg-muted/40 text-muted-foreground cursor-not-allowed pr-9"
                      value={isNew && nextCodeLoading ? "" : form.employeeCode}
                      readOnly
                      disabled
                      placeholder={isNew && nextCodeLoading ? "..." : "EMP-001"}
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
                  </div>
                </div>
                {fi(t("employees.department"), "department", t("employees.departmentPlaceholder"))}
                {/* Designation — dropdown from user_roles */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">{t("employees.designation")}</Label>
                  <Select value={form.designation} onValueChange={set("designation")}>
                    <SelectTrigger className="h-10 rounded-xl border-border/70 text-sm">
                      <SelectValue placeholder={t("employees.designationPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {userRoles.map((role) => (
                        <SelectItem key={role.id} value={role.label}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">{t("employees.status")}</Label>
                  <Select value={form.status} onValueChange={set("status")}>
                    <SelectTrigger className="h-10 rounded-xl border-border/70 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_LIST.map((s) => (
                        <SelectItem key={s} value={s}>{t(`employees.status_${s}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">{t("employees.salary")} (৳)</Label>
                  <Input className="h-10 rounded-xl border-border/70 text-sm" type="number" min={0}
                    value={form.salary} onChange={onInput("salary")} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">{t("employees.salaryGrade")}</Label>
                  <Select
                    value={form.salaryGradeId || "__none__"}
                    onValueChange={(v) => setForm((f) => ({ ...f, salaryGradeId: v === "__none__" ? "" : v }))}
                  >
                    <SelectTrigger className="h-10 rounded-xl border-border/70 text-sm">
                      <SelectValue placeholder={t("employees.salaryGradePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">{t("employees.noGrade")}</SelectItem>
                      {salaryGrades.map((g) => (
                        <SelectItem key={g.id} value={String(g.id)}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.salaryGradeId && (
                    <p className="text-xs text-muted-foreground">{t("employees.salaryGradeHint")}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">{t("employees.joiningDate")}</Label>
                  <Input className="h-10 rounded-xl border-border/70 text-sm" type="date"
                    value={form.joiningDate} onChange={onInput("joiningDate")} />
                </div>
              </div>
            </div>

            {/* ── Section 2: Contact ───────────────────────────── */}
            <div>
              <SectionHeader icon={Phone} label={t("employees.sectionContact")} accent="bg-blue-500/8" iconColor="text-blue-600" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fi(t("common.phone"), "phone", "01XXXXXXXXX")}
                {fi(t("employees.emergencyContact"), "emergencyContact", "01XXXXXXXXX")}
                {fi(t("common.email"), "email", "example@email.com", "email")}
                {fi(t("common.address"), "address", t("employees.addressPlaceholder"))}
              </div>
            </div>

            {/* ── Section 3: Personal ──────────────────────────── */}
            <div>
              <SectionHeader icon={Users} label={t("employees.sectionPersonal")} accent="bg-violet-500/8" iconColor="text-violet-600" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fi(t("employees.fatherName"), "fatherName", t("employees.fatherNamePlaceholder"))}
                {fi(t("employees.motherName"), "motherName", t("employees.motherNamePlaceholder"))}
                {fi(t("employees.nidNumber"), "nidNumber", "XXXXXXXXXXXXXXXX")}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">{t("employees.gender")}</Label>
                  <Select value={form.gender} onValueChange={set("gender")}>
                    <SelectTrigger className="h-10 rounded-xl border-border/70 text-sm"><SelectValue placeholder={t("common.selectOption")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">{t("employees.genderMale")}</SelectItem>
                      <SelectItem value="female">{t("employees.genderFemale")}</SelectItem>
                      <SelectItem value="other">{t("employees.genderOther")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">{t("employees.bloodGroup")}</Label>
                  <Select value={form.bloodGroup} onValueChange={set("bloodGroup")}>
                    <SelectTrigger className="h-10 rounded-xl border-border/70 text-sm"><SelectValue placeholder={t("common.selectOption")} /></SelectTrigger>
                    <SelectContent>
                      {BLOOD_GROUPS.map((bg) => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">{t("employees.dateOfBirth")}</Label>
                  <Input className="h-10 rounded-xl border-border/70 text-sm" type="date"
                    value={form.dateOfBirth} onChange={onInput("dateOfBirth")} />
                </div>
              </div>
            </div>

            {/* ── Section 4: Documents ────────────────────────── */}
            <div>
              <SectionHeader icon={FileText} label={t("employees.sectionDocs")} accent="bg-emerald-500/8" iconColor="text-emerald-600" />
              <div className="space-y-2">
                <DocUploader label={t("employees.docs.nid")} accept="image/jpeg,image/png,image/webp,application/pdf"
                  currentPath={form.nidDocPath} docType="nid" shopId={shopId}
                  onUploaded={(p) => set("nidDocPath")(p)} onRemoved={() => set("nidDocPath")("")} />
                <DocUploader label={t("employees.docs.cv")} accept="application/pdf,image/jpeg,image/png"
                  currentPath={form.cvPath} docType="cv" shopId={shopId}
                  onUploaded={(p) => set("cvPath")(p)} onRemoved={() => set("cvPath")("")} />
                <DocUploader label={t("employees.docs.contract")} accept="application/pdf,image/jpeg,image/png"
                  currentPath={form.contractPath} docType="contract" shopId={shopId}
                  onUploaded={(p) => set("contractPath")(p)} onRemoved={() => set("contractPath")("")} />
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">{t("employees.docs.hint")}</p>
            </div>

            {/* ── Section 5: Notes ────────────────────────────── */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">{t("common.note")}</Label>
              <Textarea className="rounded-xl border-border/70 min-h-[72px] resize-none text-sm"
                value={form.notes} onChange={(e) => set("notes")(e.target.value)}
                placeholder={t("employees.notesPlaceholder")} />
            </div>

            {/* ── Section 5.5: Weekly Schedule (edit mode only) ── */}
            {!isNew && employee && !employee.isSystemOnly && availableShifts.filter((s) => s.isActive).length > 0 && (
              <div>
                <SectionHeader icon={CalendarDays} label={t("employees.weeklyScheduleSection")} accent="bg-amber-500/8" iconColor="text-amber-600" />
                <p className="text-xs text-muted-foreground mb-3 -mt-1">{t("employees.weeklyScheduleSectionDesc")}</p>
                <div className="grid grid-cols-7 gap-1.5">
                  {([0, 1, 2, 3, 4, 5, 6] as const).map((wd) => {
                    const entry = editScheduleMap.get(wd);
                    const dayLabel = t(`schedule.weekdaysShort.${wd}`);
                    const currentValue = entry ? String(entry.shiftId) : "__off__";
                    const isUpdating = scheduleUpdating[wd] ?? false;

                    return (
                      <div key={wd} className="flex flex-col items-center gap-1.5">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest text-center">{dayLabel}</p>
                        <Select
                          value={currentValue}
                          onValueChange={(v) => handleScheduleChange(wd, entry, v)}
                          disabled={isUpdating}
                        >
                          <SelectTrigger className="h-auto min-h-[52px] rounded-xl border-border/60 p-1.5 text-center [&>svg]:hidden w-full">
                            {isUpdating ? (
                              <div className="flex items-center justify-center w-full">
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                              </div>
                            ) : entry ? (
                              <div className="flex flex-col items-center gap-1 w-full">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.shiftColor ?? "hsl(var(--primary))" }} />
                                <p className="text-[10px] font-semibold leading-tight text-center break-all" style={{ color: entry.shiftColor ?? "hsl(var(--foreground))" }}>
                                  {i18n.language === "bn" ? (entry.shiftNameBn ?? entry.shiftName) : entry.shiftName}
                                </p>
                              </div>
                            ) : (
                              <p className="text-[10px] text-muted-foreground w-full text-center">{t("schedule.dayOff")}</p>
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__off__">
                              <span className="text-xs text-muted-foreground">{t("schedule.dayOff")}</span>
                            </SelectItem>
                            {availableShifts.filter((s) => s.isActive).map((s) => (
                              <SelectItem key={s.id} value={String(s.id)}>
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color ?? "hsl(var(--primary))" }} />
                                  <span className="text-xs">{i18n.language === "bn" ? s.nameBn : s.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Section 6: POS Access ────────────────────────── */}

            {/* New employees: toggle to add POS access */}
            {!employee && (
              <div className={`rounded-2xl border-2 transition-colors ${posAccess ? "border-primary/30 bg-primary/4" : "border-border/60 bg-muted/30"}`}>
                <div className="flex items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${posAccess ? "bg-primary/12" : "bg-muted"}`}>
                      <Monitor className={`h-5 w-5 transition-colors ${posAccess ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t("employees.posAccess")}</p>
                      <p className="text-xs text-muted-foreground">{t("employees.posAccessDesc")}</p>
                    </div>
                  </div>
                  <Switch
                    checked={posAccess}
                    onCheckedChange={(v) => {
                      setPosAccess(v);
                      if (v && !posEmail && form.email) setPosEmail(form.email);
                    }}
                  />
                </div>
                {posAccess && (
                  <div className="px-4 pb-4 border-t border-primary/20 pt-4 space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <Lock className="h-3.5 w-3.5 text-primary" />
                      <p className="text-xs font-semibold text-primary uppercase tracking-wider">{t("employees.posCredentials")}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">{t("employees.posEmail")}</Label>
                        <Input className="h-10 rounded-xl border-primary/30 text-sm bg-card"
                          type="email" value={posEmail}
                          onChange={(e) => setPosEmail(e.target.value)}
                          placeholder="user@dokan360.com" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">{t("employees.posPassword")}</Label>
                        <Input className="h-10 rounded-xl border-primary/30 text-sm bg-card"
                          type="password" value={posPassword}
                          onChange={(e) => setPosPassword(e.target.value)}
                          placeholder="••••••••" />
                        <p className="text-[11px] text-muted-foreground">{t("employees.posPasswordHint")}</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">{t("employees.posRole")}</Label>
                        <Select value={posRole} onValueChange={setPosRole}>
                          <SelectTrigger className="h-10 rounded-xl border-primary/30 text-sm bg-card">
                            <div className="flex items-center gap-2">
                              <RoleIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" />{t("settings.roleAdmin")}</div>
                            </SelectItem>
                            <SelectItem value="seller">
                              <div className="flex items-center gap-2"><ShoppingBag className="h-3.5 w-3.5" />{t("settings.roleSeller")}</div>
                            </SelectItem>
                            <SelectItem value="viewer">
                              <div className="flex items-center gap-2"><Eye className="h-3.5 w-3.5" />{t("settings.roleViewer")}</div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end pb-0.5">
                        <div className="w-full rounded-xl bg-primary/8 border border-primary/20 px-3 py-2.5 text-xs text-primary">
                          <p className="font-semibold">{t("employees.posRoleHint")}</p>
                          <p className="text-primary/70 mt-0.5">{t("employees.posRoleHintDesc")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Edit mode: show current access OR grant form */}
            {employee && (
              <div className={`rounded-2xl border-2 transition-colors ${employee.hasSystemAccess ? "border-emerald-500/30 bg-emerald-500/4" : "border-border/60 bg-muted/30"}`}>
                <div className="flex items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${employee.hasSystemAccess ? "bg-emerald-500/12" : "bg-muted"}`}>
                      <Monitor className={`h-5 w-5 ${employee.hasSystemAccess ? "text-emerald-600" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t("employees.posAccess")}</p>
                      {employee.hasSystemAccess
                        ? <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{t("employees.currentAccess")} · {employee.systemRoleLabel ?? getRoleDisplayLabel(employee.systemRole ?? null, userRoles)}</p>
                        : <p className="text-xs text-muted-foreground">{t("employees.posAccessDesc")}</p>}
                    </div>
                  </div>
                  {employee.hasSystemAccess ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive" disabled={accessBusy}>
                          {accessBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                          {t("employees.revokeAccess")}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("employees.revokeAccessTitle")}</AlertDialogTitle>
                          <AlertDialogDescription>{t("employees.revokeAccessDesc")}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
                          <AlertDialogAction className="rounded-xl bg-destructive hover:bg-destructive/90" onClick={handleRevokeAccess}>
                            {t("employees.revokeAccess")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/8 hover:text-primary"
                      onClick={() => setGrantOpen((v) => !v)}>
                      <Monitor className="h-3.5 w-3.5" />
                      {t("employees.grantAccess")}
                    </Button>
                  )}
                </div>
                {!employee.hasSystemAccess && grantOpen && (
                  <div className="px-4 pb-4 border-t border-border/40 pt-4 space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <Lock className="h-3.5 w-3.5 text-primary" />
                      <p className="text-xs font-semibold text-primary uppercase tracking-wider">{t("employees.posCredentials")}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">{t("employees.posEmail")}</Label>
                        <Input className="h-10 rounded-xl border-primary/30 text-sm bg-card"
                          type="email" value={grantEmail}
                          onChange={(e) => setGrantEmail(e.target.value)}
                          placeholder="user@dokan360.com" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">{t("employees.posPassword")}</Label>
                        <Input className="h-10 rounded-xl border-primary/30 text-sm bg-card"
                          type="password" value={grantPassword}
                          onChange={(e) => setGrantPassword(e.target.value)}
                          placeholder="••••••••" />
                        <p className="text-[11px] text-muted-foreground">{t("employees.posPasswordHint")}</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">{t("employees.posRole")}</Label>
                        <Select value={grantRole} onValueChange={setGrantRole}>
                          <SelectTrigger className="h-10 rounded-xl border-primary/30 text-sm bg-card"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin"><div className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" />{t("settings.roleAdmin")}</div></SelectItem>
                            <SelectItem value="seller"><div className="flex items-center gap-2"><ShoppingBag className="h-3.5 w-3.5" />{t("settings.roleSeller")}</div></SelectItem>
                            <SelectItem value="viewer"><div className="flex items-center gap-2"><Eye className="h-3.5 w-3.5" />{t("settings.roleViewer")}</div></SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <Button className="w-full rounded-xl gap-2 h-10" onClick={handleGrantAccess} disabled={accessBusy}>
                          {accessBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Monitor className="h-4 w-4" />}
                          {t("employees.grantAccess")}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Sticky footer ────────────────────────────────────── */}
        <div className="shrink-0 bg-card border-t border-border/50 px-5 py-3.5 rounded-b-2xl flex items-center justify-between gap-3">
          <Button variant="outline" className="rounded-xl px-5" onClick={onClose} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button className="rounded-xl px-6 gap-2 min-w-[120px]" onClick={handleSave} disabled={saving}>
            {saving
              ? <><Loader2 className="h-4 w-4 animate-spin" />{t("common.loading")}</>
              : (employee ? t("common.save") : t("employees.addBtn"))
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Employee card ──────────────────────────────────────────── */
function EmployeeCard({
  employee, onEdit, onDelete,
}: {
  employee: Employee; onEdit: () => void; onDelete: () => void;
}) {
  const { t } = useTranslation();
  const { formatCurrency } = useLocale();
  const [, navigate] = useLocation();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isSystemOnly = employee.isSystemOnly;

  return (
    <motion.div variants={fadeInUp} whileHover={{ y: -2, transition: { duration: 0.15 } }}>
      <Card className={`border-border/60 shadow-sm hover:shadow-md transition-shadow ${isSystemOnly ? "border-blue-200 dark:border-blue-900" : ""}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`h-11 w-11 rounded-xl overflow-hidden flex items-center justify-center shrink-0 ${isSystemOnly ? "bg-blue-500/12 border border-blue-500/20" : "bg-primary/12 border border-primary/20"}`}>
                {isSystemOnly
                  ? <Monitor className="h-5 w-5 text-blue-600" />
                  : employee.photo
                  ? <StoragePhoto path={employee.photo} fallback={<span className="text-base font-bold text-primary">{employee.name.charAt(0).toUpperCase()}</span>} />
                  : <span className="text-base font-bold text-primary">{employee.name.charAt(0).toUpperCase()}</span>
                }
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground leading-tight truncate">{employee.name}</p>
                {isSystemOnly
                  ? <p className="text-xs text-blue-600 dark:text-blue-400 truncate">{t("employees.systemOnly")}</p>
                  : <>
                    {employee.designation && <p className="text-xs text-muted-foreground truncate">{employee.designation}</p>}
                    {employee.department && <p className="text-xs text-muted-foreground truncate">{employee.department}</p>}
                  </>
                }
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              {!isSystemOnly && <StatusBadge status={employee.status} />}
              {employee.hasSystemAccess && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 px-2 py-0.5 text-[10px] font-semibold">
                  <Monitor className="h-2.5 w-2.5" />POS
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5 mb-3">
            {!isSystemOnly && employee.employeeCode && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{employee.employeeCode}</span>
              </div>
            )}
            {employee.phone && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{employee.phone}</span>
              </div>
            )}
            {employee.email && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{employee.email}</span>
              </div>
            )}
            {!isSystemOnly && employee.joiningDate && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>{employee.joiningDate}</span>
              </div>
            )}
            {!isSystemOnly && employee.salary !== null && employee.salary !== undefined && (
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <DollarSign className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span>{formatCurrency(employee.salary)}</span>
              </div>
            )}
            {!isSystemOnly && employee.salaryGradeId !== null && employee.salaryGradeId !== undefined && (
              <div className="flex items-center gap-1.5 text-xs text-lime-700 dark:text-lime-400 font-medium">
                <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                <span>{t("employees.salaryGrade")}</span>
              </div>
            )}
            {isSystemOnly && employee.systemRole && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                <span>{employee.systemRoleLabel ?? getRoleDisplayLabel(employee.systemRole ?? null)}</span>
              </div>
            )}
          </div>

          {/* Document badges (real employees only) */}
          {!isSystemOnly && (employee.photo || employee.nidDocPath || employee.cvPath || employee.contractPath) && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {employee.photo && (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-400 px-2 py-0.5 text-xs font-medium">
                  <ImageIcon className="h-3 w-3" />{t("employees.docs.photo")}
                </span>
              )}
              {employee.nidDocPath && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 px-2 py-0.5 text-xs font-medium">
                  <FileCheck2 className="h-3 w-3" />{t("employees.docs.nidShort")}
                </span>
              )}
              {employee.cvPath && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 text-xs font-medium">
                  <FileText className="h-3 w-3" />{t("employees.docs.cvShort")}
                </span>
              )}
              {employee.contractPath && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 px-2 py-0.5 text-xs font-medium">
                  <FileText className="h-3 w-3" />{t("employees.docs.contractShort")}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-border/40">
            {!isSystemOnly && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 flex-1 rounded-lg text-xs gap-1.5 hover:bg-primary/8 text-primary hover:text-primary"
                onClick={() => navigate(`/employees/${employee.id}`)}
              >
                <Eye className="h-3.5 w-3.5" />
                {t("employeeProfile.viewProfile")}
              </Button>
            )}
            {isSystemOnly && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 flex-1 rounded-lg text-xs gap-1.5 hover:bg-muted/60"
                onClick={onEdit}
              >
                <UserPlus className="h-3.5 w-3.5" />
                {t("employees.createProfile")}
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0 hover:bg-muted/60">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl">
                <DropdownMenuItem onClick={onEdit} className="gap-2 cursor-pointer rounded-lg">
                  <Pencil className="h-4 w-4" />
                  {t("common.edit")}
                </DropdownMenuItem>
                {!isSystemOnly && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleteOpen(true)}
                      className="gap-2 cursor-pointer rounded-lg text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t("common.delete")}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {!isSystemOnly && (
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("employees.deleteTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("employees.deleteDesc")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    className="rounded-xl bg-destructive hover:bg-destructive/90"
                    onClick={onDelete}
                  >
                    {t("common.delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─── Main page ──────────────────────────────────────────────── */
export default function EmployeesPage() {
  const { t } = useTranslation();
  const { formatCurrency } = useLocale();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState("all");
  const [deptFilter, setDept]       = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEmp, setEditEmp]       = useState<Employee | null>(null);

  const queryParams = useMemo(() => {
    const p: Record<string, string> = {};
    if (search) p.search = search;
    if (statusFilter !== "all") p.status = statusFilter;
    if (deptFilter !== "all") p.department = deptFilter;
    return p;
  }, [search, statusFilter, deptFilter]);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: [...EMPLOYEES_KEY, queryParams],
    queryFn: () => fetchEmployees(queryParams),
  });

  const { data: stats } = useQuery({
    queryKey: STATS_KEY,
    queryFn: fetchStats,
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiDeleteEmployee(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EMPLOYEES_KEY });
      qc.invalidateQueries({ queryKey: STATS_KEY });
      toast({ title: t("employees.deleted") });
    },
    onError: () => toast({ title: t("employees.deleteFailed"), variant: "destructive" }),
  });

  function openAdd() { setEditEmp(null); setDialogOpen(true); }
  function openEdit(emp: Employee) { setEditEmp(emp); setDialogOpen(true); }
  function closeDialog() { setDialogOpen(false); setEditEmp(null); }

  const departments = stats?.departments ?? [];

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex justify-end">
        <Button onClick={openAdd} className="rounded-xl gap-2 shrink-0 shadow-sm">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t("employees.addBtn")}</span>
        </Button>
      </div>

      {/* Stat cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <StatCard icon={Users}     label={t("employees.statTotal")}    value={stats?.total ?? 0}    accent="bg-primary/12"    iconColor="text-primary" />
        <StatCard icon={UserCheck} label={t("employees.statActive")}   value={stats?.active ?? 0}   accent="bg-emerald-500/12" iconColor="text-emerald-600" />
        <StatCard icon={UserX}     label={t("employees.statInactive")} value={(stats?.inactive ?? 0) + (stats?.suspended ?? 0) + (stats?.resigned ?? 0)} accent="bg-red-500/12" iconColor="text-red-500" />
        <StatCard icon={DollarSign} label={t("employees.statSalary")}  value={formatCurrency(stats?.totalSalary ?? 0)} accent="bg-amber-500/12" iconColor="text-amber-600" />
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 h-10 rounded-xl"
            placeholder={t("employees.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatus}>
          <TabsList className="h-10 rounded-xl">
            <TabsTrigger value="all" className="rounded-lg text-xs px-3">{t("common.all")}</TabsTrigger>
            <TabsTrigger value="active" className="rounded-lg text-xs px-3">{t("employees.statusActive")}</TabsTrigger>
            <TabsTrigger value="inactive" className="rounded-lg text-xs px-3">{t("employees.statusInactive")}</TabsTrigger>
            <TabsTrigger value="suspended" className="rounded-lg text-xs px-3">{t("employees.statusSuspended")}</TabsTrigger>
            <TabsTrigger value="resigned" className="rounded-lg text-xs px-3">{t("employees.statusResigned")}</TabsTrigger>
          </TabsList>
        </Tabs>
        {departments.length > 0 && (
          <Select value={deptFilter} onValueChange={setDept}>
            <SelectTrigger className="h-10 rounded-xl w-auto min-w-[160px]">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("employees.allDepts")}</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d!}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px] rounded-xl" />
          ))}
        </div>
      ) : employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="font-semibold text-foreground">{t("employees.noEmployees")}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("employees.noEmployeesDesc")}</p>
          <Button onClick={openAdd} className="mt-4 rounded-xl gap-2">
            <Plus className="h-4 w-4" />
            {t("employees.addBtn")}
          </Button>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={JSON.stringify(queryParams)}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {employees.map((emp) => (
              <EmployeeCard
                key={emp.id}
                employee={emp}
                onEdit={() => openEdit(emp)}
                onDelete={() => deleteMut.mutate(emp.id)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Form dialog */}
      <EmployeeFormDialog open={dialogOpen} onClose={closeDialog} employee={editEmp} />
    </div>
  );
}
