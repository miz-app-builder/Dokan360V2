import { Button } from "@/components/ui/button";
import { FileText, Sheet } from "lucide-react";
import * as XLSX from "xlsx";

export interface ExcelColumn {
  header: string;
  key:    string;
  width?: number;
}

interface ExportToolbarProps {
  printId:     string;
  excelData:   Record<string, unknown>[];
  excelCols:   ExcelColumn[];
  filename:    string;
  disabled?:   boolean;
}

export function exportToExcel(
  data:     Record<string, unknown>[],
  cols:     ExcelColumn[],
  filename: string,
) {
  const rows = data.map((row) =>
    Object.fromEntries(cols.map((c) => [c.header, row[c.key] ?? ""]))
  );
  const ws = XLSX.utils.json_to_sheet(rows, { header: cols.map((c) => c.header) });
  ws["!cols"] = cols.map((c) => ({ wch: c.width ?? 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "রিপোর্ট");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function ExportToolbar({
  printId,
  excelData,
  excelCols,
  filename,
  disabled,
}: ExportToolbarProps) {
  const handlePdf = () => {
    const el = document.getElementById(printId);
    if (!el) return;
    const html = `
      <html><head><title>${filename}</title>
      <style>
        body { font-family: "Hind Siliguri", Arial, sans-serif; font-size: 12px; color: #111; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; }
        th { background: #f3f4f6; font-weight: 600; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .kpi-row { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
        .kpi { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; min-width: 120px; }
        .kpi-label { font-size: 10px; color: #6b7280; text-transform: uppercase; }
        .kpi-value { font-size: 20px; font-weight: 700; margin-top: 2px; }
        @media print { .no-print { display: none; } }
      </style></head>
      <body>${el.innerHTML}</body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 400);
  };

  const handleExcel = () => exportToExcel(excelData, excelCols, filename);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        disabled={disabled}
        onClick={handlePdf}
      >
        <FileText className="h-3.5 w-3.5" />
        PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        disabled={disabled}
        onClick={handleExcel}
      >
        <Sheet className="h-3.5 w-3.5" />
        Excel
      </Button>
    </div>
  );
}
