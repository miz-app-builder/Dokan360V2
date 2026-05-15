import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays } from "lucide-react";

export interface DateRange {
  from: string;
  to:   string;
}

interface DateRangePickerProps {
  value:    DateRange;
  onChange: (range: DateRange) => void;
}

function fmt(d: Date) { return d.toISOString().slice(0, 10); }

const PRESETS = [
  {
    label: "আজ",
    range: (): DateRange => { const t = fmt(new Date()); return { from: t, to: t }; },
  },
  {
    label: "গতকাল",
    range: (): DateRange => {
      const d = new Date(); d.setDate(d.getDate() - 1);
      const t = fmt(d); return { from: t, to: t };
    },
  },
  {
    label: "৭ দিন",
    range: (): DateRange => {
      const d = new Date(); d.setDate(d.getDate() - 6);
      return { from: fmt(d), to: fmt(new Date()) };
    },
  },
  {
    label: "৩০ দিন",
    range: (): DateRange => {
      const d = new Date(); d.setDate(d.getDate() - 29);
      return { from: fmt(d), to: fmt(new Date()) };
    },
  },
  {
    label: "এই মাস",
    range: (): DateRange => {
      const d = new Date(); d.setDate(1);
      return { from: fmt(d), to: fmt(new Date()) };
    },
  },
  {
    label: "গত মাস",
    range: (): DateRange => {
      const first = new Date(); first.setDate(1); first.setMonth(first.getMonth() - 1);
      const last  = new Date(); last.setDate(0);
      return { from: fmt(first), to: fmt(last) };
    },
  },
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [draft, setDraft] = useState(value);

  const apply = () => onChange(draft);

  const applyPreset = (range: DateRange) => {
    setDraft(range);
    onChange(range);
  };

  return (
    <div className="space-y-3">
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <Button
            key={p.label}
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => applyPreset(p.range())}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* Manual inputs */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">শুরুর তারিখ</Label>
          <Input
            className="mt-1 h-8 w-36 text-sm"
            type="date"
            value={draft.from}
            onChange={(e) => setDraft((p) => ({ ...p, from: e.target.value }))}
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">শেষের তারিখ</Label>
          <Input
            className="mt-1 h-8 w-36 text-sm"
            type="date"
            value={draft.to}
            onChange={(e) => setDraft((p) => ({ ...p, to: e.target.value }))}
          />
        </div>
        <Button size="sm" className="h-8 gap-1.5" onClick={apply}>
          <CalendarDays className="h-3.5 w-3.5" />
          প্রয়োগ
        </Button>
      </div>
    </div>
  );
}
