import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/hooks/useLocale";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { customFetch, useGetAttendanceReport } from "@workspace/api-client-react";
import { supabase } from "@/lib/supabase";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  Banknote,
  User,
  Heart,
  Shield,
  FileText,
  ImageIcon,
  FileCheck2,
  Clock,
  TrendingUp,
  Activity,
  Users,
  AlertCircle,
  ExternalLink,
  CalendarDays,
} from "lucide-react";
import { EmployeeLeaveSection } from "@/components/leaves/EmployeeLeaveSection";

/* ─── Types ───────────────────────────────────────────────────── */
type EmployeeStatus = "active" | "inactive" | "suspended" | "resigned";
type EmployeeGender = "male" | "female" | "other";
type BloodGroup = "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-";

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
  status: EmployeeStatus;
  department?: string | null;
  designation?: string | null;
  photo?: string | null;
  nidDocPath?: string | null;
  cvPath?: string | null;
  contractPath?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

/* ─── API ─────────────────────────────────────────────────────── */
async function fetchEmployee(id: number): Promise<Employee> {
  return customFetch<Employee>(`/api/employees/${id}`);
}

/* ─── Storage helper ─────────────────────────────────────────── */
const BUCKET = "employee-docs";
async function getSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/* ─── Status badge ───────────────────────────────────────────── */
function StatusBadge({ status }: { status: EmployeeStatus }) {
  const { t } = useTranslation();
  const map: Record<EmployeeStatus, { label: string; className: string }> = {
    active:    { label: t("employees.statusActive"),    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" },
    inactive:  { label: t("employees.statusInactive"),  className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700" },
    suspended: { label: t("employees.statusSuspended"), className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
    resigned:  { label: t("employees.statusResigned"),  className: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-900" },
  };
  const { label, className } = map[status] ?? map.active;
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

/* ─── Info row ───────────────────────────────────────────────── */
function InfoRow({ icon: Icon, label, value, accent = "text-muted-foreground" }: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
  accent?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0">
      <div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className={`h-4 w-4 ${accent}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground leading-none mb-1">{label}</p>
        <p className="text-sm font-medium text-foreground break-words">{value}</p>
      </div>
    </div>
  );
}

/* ─── Coming soon card ───────────────────────────────────────── */
function ComingSoonCard({ icon: Icon, title, description, accent }: {
  icon: React.ElementType;
  title: string;
  description: string;
  accent: string;
}) {
  const { t } = useTranslation();
  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${accent}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 py-8 flex flex-col items-center gap-2">
          <AlertCircle className="h-6 w-6 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">{t("employeeProfile.comingSoon")}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Duty Schedule Widget ───────────────────────────────────── */
function DutyScheduleWidget({ employeeId }: { employeeId: number }) {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["schedules", "weekly", employeeId],
    queryFn: () => customFetch<DutyScheduleDto[]>(`/api/schedules?employeeId=${employeeId}&type=weekly`),
    staleTime: 30 * 1000,
  });

  const dayMap = new Map<number, DutyScheduleDto>();
  for (const s of schedules) {
    if (s.weekday !== null) dayMap.set(s.weekday, s);
  }

  const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-amber-500/12 flex items-center justify-center">
            <CalendarDays className="h-3.5 w-3.5 text-amber-500" />
          </div>
          {t("employeeProfile.dutySchedule")}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((d) => <Skeleton key={d} className="h-16 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((wd) => {
              const entry = dayMap.get(wd);
              const dayLabel = t(`schedule.weekdaysShort.${wd}`);
              const shiftName = entry ? (isBn ? (entry.shiftNameBn ?? entry.shiftName) : entry.shiftName) : null;

              return (
                <div key={wd} className="flex flex-col items-center gap-1.5">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{dayLabel}</p>
                  {entry && shiftName ? (
                    <div
                      className="w-full rounded-xl px-1.5 py-2.5 flex flex-col items-center gap-1 min-h-[52px] justify-center"
                      style={{ backgroundColor: entry.shiftColor ? `${entry.shiftColor}22` : "hsl(var(--muted))", border: `1px solid ${entry.shiftColor ?? "hsl(var(--border))"}44` }}
                    >
                      <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.shiftColor ?? "hsl(var(--muted-foreground))" }} />
                      <p className="text-[10px] font-semibold text-center leading-tight break-words" style={{ color: entry.shiftColor ?? "hsl(var(--foreground))" }}>
                        {shiftName}
                      </p>
                      {entry.shiftStartTime && entry.shiftEndTime && (
                        <p className="text-[9px] text-muted-foreground">{entry.shiftStartTime}–{entry.shiftEndTime}</p>
                      )}
                    </div>
                  ) : (
                    <div className="w-full rounded-xl border border-dashed border-border/50 bg-muted/20 min-h-[52px] flex items-center justify-center">
                      <p className="text-[10px] text-muted-foreground">—</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {!isLoading && schedules.length === 0 && (
          <p className="text-xs text-muted-foreground text-center mt-3">{t("employeeProfile.noScheduleData")}</p>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Attendance helpers ─────────────────────────────────────── */
const MONTHS = [
  { v: "1",  bn: "জানুয়ারি",   en: "January"   },
  { v: "2",  bn: "ফেব্রুয়ারি",  en: "February"  },
  { v: "3",  bn: "মার্চ",       en: "March"     },
  { v: "4",  bn: "এপ্রিল",      en: "April"     },
  { v: "5",  bn: "মে",          en: "May"       },
  { v: "6",  bn: "জুন",         en: "June"      },
  { v: "7",  bn: "জুলাই",       en: "July"      },
  { v: "8",  bn: "আগস্ট",       en: "August"    },
  { v: "9",  bn: "সেপ্টেম্বর",   en: "September" },
  { v: "10", bn: "অক্টোবর",     en: "October"   },
  { v: "11", bn: "নভেম্বর",     en: "November"  },
  { v: "12", bn: "ডিসেম্বর",    en: "December"  },
];

function pctColor(p: number) {
  if (p >= 90) return "text-emerald-600 dark:text-emerald-400";
  if (p >= 70) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}
function pctBg(p: number) {
  if (p >= 90) return "bg-emerald-500";
  if (p >= 70) return "bg-amber-500";
  return "bg-red-500";
}

/* ─── Attendance Summary Widget ──────────────────────────────── */
function AttendanceSummaryWidget({ employeeId }: { employeeId: number }) {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";
  const now  = new Date();
  const [year,  setYear]  = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const years = Array.from({ length: 3 }, (_, i) => String(now.getFullYear() - i));

  const { data: report, isLoading } = useGetAttendanceReport({
    year: Number(year),
    month: Number(month),
    employeeId,
  });

  const emp = report?.data?.[0];

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-blue-500/12 flex items-center justify-center">
              <Clock className="h-3.5 w-3.5 text-blue-500" />
            </div>
            {t("employeeProfile.attendance")}
          </CardTitle>
          <div className="flex gap-2">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.v} value={m.v} className="text-xs">
                    {isBn ? m.bn : m.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="h-8 w-24 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y} className="text-xs">{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-20 rounded" />
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          </div>
        ) : !emp ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 py-8 flex flex-col items-center gap-2">
            <Clock className="h-6 w-6 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">{t("attendance.noData")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className={`text-3xl font-bold ${pctColor(emp.attendancePercent)}`}>
                  {emp.attendancePercent}%
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("attendance.attendancePercent")}
                </p>
              </div>
              <p className="text-xs text-muted-foreground pb-1">
                {t("attendance.workingDays", { days: report!.workingDays })}
              </p>
            </div>

            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${pctBg(emp.attendancePercent)}`}
                style={{ width: `${Math.min(100, emp.attendancePercent)}%` }}
              />
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
              {([
                { label: t("attendance.present"), value: emp.present,  cls: "text-emerald-600 dark:text-emerald-400" },
                { label: t("attendance.late"),    value: emp.late,     cls: "text-amber-600 dark:text-amber-400"     },
                { label: t("attendance.absent"),  value: emp.absent,   cls: "text-red-600 dark:text-red-400"         },
                { label: t("attendance.halfDay"), value: emp.halfDay,  cls: "text-orange-600 dark:text-orange-400"   },
                { label: t("attendance.leave"),   value: emp.leave,    cls: "text-purple-600 dark:text-purple-400"   },
                { label: t("attendance.holiday"), value: emp.holiday,  cls: "text-blue-600 dark:text-blue-400"       },
              ] as const).map(({ label, value, cls }) => (
                <div key={label} className="bg-muted/40 rounded-lg p-2.5">
                  <p className={`text-lg font-bold ${cls}`}>{value}</p>
                  <p className="text-xs text-muted-foreground leading-tight mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {(emp.lateMinutesTotal > 0 || emp.overtimeMinutesTotal > 0) && (
              <div className="flex flex-wrap gap-2 pt-1">
                {emp.lateMinutesTotal > 0 && (
                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-200 dark:border-amber-800">
                    {t("attendance.lateMinutes", { minutes: emp.lateMinutesTotal })}
                  </Badge>
                )}
                {emp.overtimeMinutesTotal > 0 && (
                  <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200 dark:border-emerald-800">
                    {t("attendance.overtimeMinutes", { minutes: emp.overtimeMinutesTotal })}
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Skeleton loader ────────────────────────────────────────── */
function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-32 rounded-xl" />
      <Skeleton className="h-40 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────── */
export default function EmployeeProfilePage() {
  const { t } = useTranslation();
  const { formatCurrency, formatDate } = useLocale();
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const employeeId = parseInt(params.id ?? "0");

  const { data: employee, isLoading, isError } = useQuery({
    queryKey: ["employees", employeeId],
    queryFn: () => fetchEmployee(employeeId),
    enabled: !isNaN(employeeId) && employeeId > 0,
  });

  const avatarLetter = employee?.name?.charAt(0)?.toUpperCase() ?? "?";

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  useEffect(() => {
    if (employee?.photo) {
      getSignedUrl(employee.photo).then(setPhotoUrl);
    } else {
      setPhotoUrl(null);
    }
  }, [employee?.photo]);

  const genderLabel = employee?.gender === "male"
    ? t("employees.genderMale")
    : employee?.gender === "female"
    ? t("employees.genderFemale")
    : employee?.gender === "other"
    ? t("employees.genderOther")
    : null;

  const joiningDate = employee?.joiningDate
    ? formatDate(employee.joiningDate, { year: "numeric", month: "long", day: "numeric" })
    : null;

  const dateOfBirth = employee?.dateOfBirth
    ? formatDate(employee.dateOfBirth, { year: "numeric", month: "long", day: "numeric" })
    : null;

  const createdAt = employee?.createdAt
    ? formatDate(employee.createdAt, { year: "numeric", month: "long", day: "numeric" })
    : null;

  const hasDocuments = !!(employee?.photo || employee?.nidDocPath || employee?.cvPath || employee?.contractPath);

  if (isLoading) return <ProfileSkeleton />;

  if (isError || !employee) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-destructive/50" />
        </div>
        <p className="font-semibold text-foreground">{t("employeeProfile.notFound")}</p>
        <p className="text-sm text-muted-foreground mt-1">{t("employeeProfile.notFoundDesc")}</p>
        <Button className="mt-4 rounded-xl gap-2" onClick={() => navigate("/employees")}>
          <ArrowLeft className="h-4 w-4" />
          {t("employeeProfile.backToList")}
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Back button */}
      <motion.div variants={fadeInUp}>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl gap-2 -ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/employees")}
        >
          <ArrowLeft className="h-4 w-4" />
          {t("employeeProfile.backToList")}
        </Button>
      </motion.div>

      {/* Hero card */}
      <motion.div variants={fadeInUp}>
        <Card className="border-border/60 shadow-sm overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-primary via-primary/70 to-primary/30" />
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Avatar */}
              <div className="h-20 w-20 rounded-2xl bg-primary/12 border-2 border-primary/20 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                {photoUrl
                  ? <img src={photoUrl} alt={employee.name} className="w-full h-full object-cover" />
                  : <span className="text-3xl font-bold text-primary">{avatarLetter}</span>
                }
              </div>

              {/* Identity */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-foreground">{employee.name}</h1>
                  <StatusBadge status={employee.status} />
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {employee.designation && (
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" />
                      {employee.designation}
                    </span>
                  )}
                  {employee.department && (
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {employee.department}
                    </span>
                  )}
                  {employee.employeeCode && (
                    <span className="flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5" />
                      {employee.employeeCode}
                    </span>
                  )}
                </div>
              </div>

              {/* Salary highlight */}
              {employee.salary !== null && employee.salary !== undefined && (
                <div className="shrink-0 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">{t("employeeProfile.monthlySalary")}</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(employee.salary)}
                  </p>
                </div>
              )}
            </div>

            {/* Quick meta */}
            <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-border/40 text-xs text-muted-foreground">
              {joiningDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {t("employeeProfile.joined")} {joiningDate}
                </span>
              )}
              {createdAt && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {t("employeeProfile.addedOn")} {createdAt}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Contact info */}
        <motion.div variants={fadeInUp}>
          <Card className="border-border/60 shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-blue-500/12 flex items-center justify-center">
                  <Phone className="h-3.5 w-3.5 text-blue-500" />
                </div>
                {t("employeeProfile.contactInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <InfoRow icon={Phone}  label={t("common.phone")}               value={employee.phone}            accent="text-blue-500" />
              <InfoRow icon={Mail}   label={t("common.email")}               value={employee.email}            accent="text-blue-500" />
              <InfoRow icon={MapPin} label={t("common.address")}             value={employee.address}          accent="text-blue-500" />
              <InfoRow icon={Phone}  label={t("employees.emergencyContact")} value={employee.emergencyContact} accent="text-red-500" />
              {!employee.phone && !employee.email && !employee.address && !employee.emergencyContact && (
                <p className="text-sm text-muted-foreground py-4 text-center">{t("employeeProfile.noData")}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Personal info */}
        <motion.div variants={fadeInUp}>
          <Card className="border-border/60 shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-violet-500/12 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-violet-500" />
                </div>
                {t("employeeProfile.personalInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <InfoRow icon={User}   label={t("employees.fatherName")} value={employee.fatherName}  accent="text-violet-500" />
              <InfoRow icon={User}   label={t("employees.motherName")} value={employee.motherName}  accent="text-violet-500" />
              <InfoRow icon={User}   label={t("employees.gender")}     value={genderLabel}          accent="text-violet-500" />
              <InfoRow icon={Heart}  label={t("employees.bloodGroup")} value={employee.bloodGroup}  accent="text-red-500" />
              <InfoRow icon={Calendar} label={t("employees.dateOfBirth")} value={dateOfBirth}       accent="text-violet-500" />
              <InfoRow icon={Shield} label={t("employees.nidNumber")}  value={employee.nidNumber}   accent="text-violet-500" />
              {!employee.fatherName && !employee.motherName && !employee.gender && !employee.bloodGroup && !employee.dateOfBirth && !employee.nidNumber && (
                <p className="text-sm text-muted-foreground py-4 text-center">{t("employeeProfile.noData")}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Job info */}
        <motion.div variants={fadeInUp}>
          <Card className="border-border/60 shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-amber-500/12 flex items-center justify-center">
                  <Briefcase className="h-3.5 w-3.5 text-amber-500" />
                </div>
                {t("employeeProfile.jobInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <InfoRow icon={Briefcase} label={t("employees.designation")}   value={employee.designation}  accent="text-amber-500" />
              <InfoRow icon={Users}     label={t("employees.department")}    value={employee.department}   accent="text-amber-500" />
              <InfoRow icon={Shield}    label={t("employees.employeeCode")}  value={employee.employeeCode} accent="text-amber-500" />
              <InfoRow icon={Calendar}  label={t("employees.joiningDate")}   value={joiningDate}           accent="text-amber-500" />
              {employee.salary !== null && employee.salary !== undefined && (
                <InfoRow
                  icon={Banknote}
                  label={t("employeeProfile.monthlySalary")}
                  value={formatCurrency(employee.salary)}
                  accent="text-emerald-500"
                />
              )}
              {!employee.designation && !employee.department && !employee.employeeCode && !employee.joiningDate && employee.salary == null && (
                <p className="text-sm text-muted-foreground py-4 text-center">{t("employeeProfile.noData")}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Documents */}
        <motion.div variants={fadeInUp}>
          <Card className="border-border/60 shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/12 flex items-center justify-center">
                  <FileText className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                {t("employeeProfile.documents")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {hasDocuments ? (
                <div className="space-y-2.5 pt-1">
                  {employee.photo && (
                    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5">
                      <div className="h-8 w-8 rounded-lg bg-violet-500/12 overflow-hidden flex items-center justify-center shrink-0">
                        {photoUrl
                          ? <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                          : <ImageIcon className="h-4 w-4 text-violet-500" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">{t("employees.docs.photo")}</p>
                        <p className="text-xs text-muted-foreground">{t("employeeProfile.docUploaded")}</p>
                      </div>
                      {photoUrl
                        ? <a href={photoUrl} target="_blank" rel="noreferrer" className="shrink-0">
                            <Badge variant="outline" className="text-xs rounded-full border-blue-300 text-blue-600 gap-1 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950">
                              <ExternalLink className="h-2.5 w-2.5" />View
                            </Badge>
                          </a>
                        : <Badge variant="outline" className="ml-auto text-xs rounded-full border-emerald-300 text-emerald-600">✓</Badge>
                      }
                    </div>
                  )}
                  {employee.nidDocPath && (
                    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/12 flex items-center justify-center">
                        <FileCheck2 className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">{t("employees.docs.nid")}</p>
                        <p className="text-xs text-muted-foreground">{t("employeeProfile.docUploaded")}</p>
                      </div>
                      <Badge variant="outline" className="ml-auto text-xs rounded-full border-emerald-300 text-emerald-600">✓</Badge>
                    </div>
                  )}
                  {employee.cvPath && (
                    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/12 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">{t("employees.docs.cv")}</p>
                        <p className="text-xs text-muted-foreground">{t("employeeProfile.docUploaded")}</p>
                      </div>
                      <Badge variant="outline" className="ml-auto text-xs rounded-full border-emerald-300 text-emerald-600">✓</Badge>
                    </div>
                  )}
                  {employee.contractPath && (
                    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5">
                      <div className="h-8 w-8 rounded-lg bg-amber-500/12 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">{t("employees.docs.contract")}</p>
                        <p className="text-xs text-muted-foreground">{t("employeeProfile.docUploaded")}</p>
                      </div>
                      <Badge variant="outline" className="ml-auto text-xs rounded-full border-emerald-300 text-emerald-600">✓</Badge>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">{t("employeeProfile.noDocs")}</p>
              )}

              {/* Notes */}
              {employee.notes && (
                <div className="mt-4 pt-4 border-t border-border/40">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">{t("common.note")}</p>
                  <p className="text-sm text-foreground leading-relaxed">{employee.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Attendance Summary Widget */}
      <motion.div variants={fadeInUp}>
        <AttendanceSummaryWidget employeeId={employeeId} />
      </motion.div>

      {/* Duty Schedule Widget */}
      <motion.div variants={fadeInUp}>
        <DutyScheduleWidget employeeId={employeeId} />
      </motion.div>

      {/* Leave Summary & Requests */}
      <motion.div variants={fadeInUp}>
        <EmployeeLeaveSection employeeId={employeeId} />
      </motion.div>

      {/* Coming soon sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div variants={fadeInUp}>
          <ComingSoonCard
            icon={TrendingUp}
            title={t("employeeProfile.performance")}
            description={t("employeeProfile.performanceDesc")}
            accent="bg-emerald-500/12 text-emerald-500"
          />
        </motion.div>
        <motion.div variants={fadeInUp}>
          <ComingSoonCard
            icon={Activity}
            title={t("employeeProfile.activityLogs")}
            description={t("employeeProfile.activityLogsDesc")}
            accent="bg-violet-500/12 text-violet-500"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
