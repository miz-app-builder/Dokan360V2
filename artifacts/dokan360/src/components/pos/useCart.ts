import { useState, useCallback, useMemo } from "react";

export interface CartItem {
  productId: number;
  nameBn: string;
  unit: string;
  price: number;
  quantity: number;
  maxStock: number;
}

export interface CartTotals {
  subtotal: number;
  total: number;
  due: number;
  change: number;
}

export function useCart() {
  const [items, setItems]               = useState<CartItem[]>([]);
  const [discount, setDiscount]         = useState(0);
  const [paid, setPaid]                 = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const addItem = useCallback(
    (product: {
      id: number;
      nameBn: string;
      unit: string;
      price: number | string;
      stockQuantity: number;
    }) => {
      setItems((prev) => {
        const existing = prev.find((c) => c.productId === product.id);
        if (existing) {
          return prev.map((c) =>
            c.productId === product.id
              ? { ...c, quantity: Math.min(c.quantity + 1, c.maxStock) }
              : c
          );
        }
        return [
          ...prev,
          {
            productId:   product.id,
            nameBn:      product.nameBn,
            unit:        product.unit,
            price:       Number(product.price),
            quantity:    1,
            maxStock:    product.stockQuantity,
          },
        ];
      });
    },
    []
  );

  const updateQty = useCallback((productId: number, qty: number) => {
    setItems((prev) =>
      prev
        .map((c) =>
          c.productId === productId
            ? { ...c, quantity: Math.max(0, Math.min(qty, c.maxStock)) }
            : c
        )
        .filter((c) => c.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((c) => c.productId !== productId));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setDiscount(0);
    setPaid(0);
    setPaymentMethod("cash");
  }, []);

  const totals = useMemo((): CartTotals => {
    const subtotal = items.reduce((s, c) => s + c.price * c.quantity, 0);
    const total    = Math.max(0, subtotal - discount);
    const due      = Math.max(0, total - paid);
    const change   = Math.max(0, paid - total);
    return { subtotal, total, due, change };
  }, [items, discount, paid]);

  const itemCount = useMemo(
    () => items.reduce((s, c) => s + c.quantity, 0),
    [items]
  );

  return {
    items,
    discount,
    setDiscount,
    paid,
    setPaid,
    paymentMethod,
    setPaymentMethod,
    addItem,
    updateQty,
    removeItem,
    clear,
    totals,
    isEmpty:   items.length === 0,
    itemCount,
  };
}
