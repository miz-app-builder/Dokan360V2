import Barcode from "react-barcode";

/* ─── Types ──────────────────────────────────────────────────── */
export type LabelSize = "sm" | "md" | "lg";

export const LABEL_SIZES: Record<LabelSize, { labelBn: string; labelEn: string; widthPx: number; heightPx: number; barcodeW: number; barcodeH: number; nameFontPx: number; priceFontPx: number }> = {
  sm: { labelBn: "ছোট (38×25mm)",  labelEn: "Small (38×25mm)",  widthPx: 144, heightPx: 94,  barcodeW: 1.1, barcodeH: 28, nameFontPx: 8,  priceFontPx: 9  },
  md: { labelBn: "মাঝারি (58×40mm)", labelEn: "Medium (58×40mm)", widthPx: 219, heightPx: 151, barcodeW: 1.6, barcodeH: 42, nameFontPx: 10, priceFontPx: 12 },
  lg: { labelBn: "বড় (100×50mm)", labelEn: "Large (100×50mm)", widthPx: 378, heightPx: 189, barcodeW: 2.1, barcodeH: 50, nameFontPx: 12, priceFontPx: 14 },
};

export interface BarcodeLabelProduct {
  id: number;
  nameBn: string;
  barcode?: string | null;
  sku?: string | null;
  price: number | string;
}

interface BarcodeLabelProps {
  product: BarcodeLabelProduct;
  size?: LabelSize;
  showPrice?: boolean;
}

/* ─── Component ──────────────────────────────────────────────── */
export function BarcodeLabel({ product, size = "md", showPrice = true }: BarcodeLabelProps) {
  const cfg = LABEL_SIZES[size];
  const code = product.barcode?.trim() || product.sku?.trim() || "";

  return (
    <div
      className="barcode-label flex flex-col items-center justify-center bg-white border border-gray-300 overflow-hidden"
      style={{ width: cfg.widthPx, minHeight: cfg.heightPx, padding: "3px 5px", boxSizing: "border-box" }}
    >
      {code ? (
        <Barcode
          value={code}
          format="CODE128"
          width={cfg.barcodeW}
          height={cfg.barcodeH}
          fontSize={8}
          displayValue
          margin={2}
          background="#ffffff"
          lineColor="#000000"
        />
      ) : (
        <div
          className="flex items-center justify-center text-center text-gray-400 border border-dashed border-gray-300 rounded"
          style={{ width: cfg.widthPx - 10, height: cfg.barcodeH + 14, fontSize: cfg.nameFontPx }}
        >
          বারকোড নেই
        </div>
      )}

      <p
        className="text-center font-semibold leading-tight w-full"
        style={{ fontSize: cfg.nameFontPx, color: "#111", marginTop: 2, maxWidth: cfg.widthPx - 8 }}
      >
        {product.nameBn}
      </p>

      {showPrice && (
        <p
          className="font-bold tabular-nums"
          style={{ fontSize: cfg.priceFontPx, color: "#000", marginTop: 1 }}
        >
          ৳{Number(product.price).toFixed(2)}
        </p>
      )}
    </div>
  );
}
