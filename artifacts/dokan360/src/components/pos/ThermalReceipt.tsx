import { QRCodeSVG } from "qrcode.react";
import type { InvoiceSummary } from "./InvoiceModal";

export type PrintSize = "58mm" | "80mm";

const PAYMENT_BN: Record<string, string> = {
  cash:   "নগদ",
  mobile: "মোবাইল ব্যাংকিং",
  card:   "কার্ড",
  credit: "বাকি",
};

function money(n: number): string {
  return `৳${n.toFixed(2)}`;
}

function formatDateTime(d: Date): { date: string; time: string } {
  const date = d.toLocaleDateString("en-BD", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
  const time = d.toLocaleTimeString("en-BD", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
  return { date, time };
}

const dash = (size: PrintSize) =>
  "─".repeat(size === "58mm" ? 28 : 38);

interface Props {
  data: InvoiceSummary;
  size: PrintSize;
}

export function ThermalReceipt({ data, size }: Props) {
  const w        = size === "58mm" ? 200 : 290;
  const fs       = size === "58mm" ? 10  : 11;
  const qrSize   = size === "58mm" ? 72  : 90;
  const { date, time } = formatDateTime(data.date);

  const root: React.CSSProperties = {
    width:          `${w}px`,
    fontFamily:     "'Hind Siliguri', 'Courier New', monospace",
    fontSize:       `${fs}px`,
    lineHeight:     "1.55",
    color:          "#000",
    background:     "#fff",
    padding:        "8px 6px",
    boxSizing:      "border-box",
  };

  const center: React.CSSProperties = { textAlign: "center" };
  const bold:   React.CSSProperties = { fontWeight: 700 };
  const row:    React.CSSProperties = { display: "flex", justifyContent: "space-between" };
  const small:  React.CSSProperties = { fontSize: `${fs - 1}px` };
  const dim:    React.CSSProperties = { ...small, color: "#444" };
  const hrStyle: React.CSSProperties = {
    border: "none", borderTop: "1px dashed #000",
    margin: "4px 0",
  };

  const subtotal = data.items.reduce((s, i) => s + i.subtotal, 0);

  return (
    <div style={root} className="thermal-receipt-root">
      {/* ── Shop header ── */}
      <div style={{ ...center, marginBottom: 2 }}>
        <div style={{ ...bold, fontSize: `${fs + 3}px`, letterSpacing: "0.02em" }}>
          {data.shopName}
        </div>
        {data.shopAddress && (
          <div style={dim}>{data.shopAddress}</div>
        )}
        {data.shopPhone && (
          <div style={dim}>📞 {data.shopPhone}</div>
        )}
      </div>

      <hr style={hrStyle} />

      {/* ── Invoice meta ── */}
      <div style={{ ...small, marginBottom: 2 }}>
        <div style={row}>
          <span>ইনভয়েস:</span>
          <span style={bold}>{data.invoiceNumber}</span>
        </div>
        <div style={row}>
          <span>তারিখ:</span>
          <span>{date}</span>
        </div>
        <div style={row}>
          <span>সময়:</span>
          <span>{time}</span>
        </div>
        {data.customerName && (
          <div style={row}>
            <span>গ্রাহক:</span>
            <span style={bold}>{data.customerName}</span>
          </div>
        )}
        <div style={row}>
          <span>পেমেন্ট:</span>
          <span>{PAYMENT_BN[data.paymentMethod] ?? data.paymentMethod}</span>
        </div>
      </div>

      <hr style={hrStyle} />

      {/* ── Items ── */}
      <div style={{ marginBottom: 4 }}>
        {/* header */}
        <div style={{ ...row, ...small, ...bold, borderBottom: "1px solid #000", paddingBottom: 2, marginBottom: 2 }}>
          <span style={{ flex: 1 }}>পণ্য</span>
          <span style={{ width: 40, textAlign: "right" }}>পরিমাণ</span>
          <span style={{ width: 52, textAlign: "right" }}>মূল্য</span>
          <span style={{ width: 56, textAlign: "right" }}>মোট</span>
        </div>

        {data.items.map((item, idx) => (
          <div key={idx} style={{ marginBottom: 2 }}>
            <div style={{ ...small, ...bold }}>{item.nameBn}</div>
            <div style={{ ...row, ...small, color: "#222" }}>
              <span style={{ flex: 1, color: "#555" }}>{item.unit}</span>
              <span style={{ width: 40, textAlign: "right" }}>{item.quantity}</span>
              <span style={{ width: 52, textAlign: "right" }}>{money(item.price)}</span>
              <span style={{ width: 56, textAlign: "right", fontWeight: 600 }}>{money(item.subtotal)}</span>
            </div>
          </div>
        ))}
      </div>

      <hr style={hrStyle} />

      {/* ── Totals ── */}
      <div style={{ ...small, marginBottom: 2 }}>
        <div style={row}>
          <span>উপমোট</span>
          <span>{money(subtotal)}</span>
        </div>
        {data.discount > 0 && (
          <div style={{ ...row, color: "#c00" }}>
            <span>ছাড়</span>
            <span>-{money(data.discount)}</span>
          </div>
        )}
        <div style={{ ...row, ...bold, fontSize: `${fs + 1}px`, borderTop: "1px solid #000", marginTop: 3, paddingTop: 3 }}>
          <span>মোট পরিশোধযোগ্য</span>
          <span>{money(data.total)}</span>
        </div>
        <div style={row}>
          <span>নগদ প্রদান</span>
          <span>{money(data.paid)}</span>
        </div>
        {data.due > 0 && (
          <div style={{ ...row, color: "#c00", fontWeight: 700 }}>
            <span>বাকি</span>
            <span>{money(data.due)}</span>
          </div>
        )}
        {data.change > 0 && (
          <div style={{ ...row, color: "#006600", fontWeight: 700 }}>
            <span>ফেরত</span>
            <span>{money(data.change)}</span>
          </div>
        )}
      </div>

      <hr style={hrStyle} />

      {/* ── QR Code ── */}
      <div style={{ ...center, margin: "6px 0" }}>
        <QRCodeSVG
          value={data.invoiceNumber}
          size={qrSize}
          level="M"
          includeMargin={false}
          style={{ display: "block", margin: "0 auto" }}
        />
        <div style={{ ...dim, marginTop: 2 }}>{data.invoiceNumber}</div>
      </div>

      <hr style={hrStyle} />

      {/* ── Footer ── */}
      <div style={{ ...center, ...small, marginTop: 4 }}>
        <div style={{ ...bold, fontSize: `${fs + 1}px` }}>ধন্যবাদ! আবার আসবেন 🙏</div>
        <div style={{ ...dim, marginTop: 2 }}>Powered by Dokan360</div>
        <div style={dim}>{dash(size)}</div>
      </div>
    </div>
  );
}
