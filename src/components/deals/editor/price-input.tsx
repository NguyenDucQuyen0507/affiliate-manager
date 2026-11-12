"use client";

import { Input } from "@/components/ui/input";
import { formatNumber } from "@/lib/format";

type PriceInputProps = Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> & {
  value: number | null;
  onChange: (value: number | null) => void;
};

/** VND amount input: shows "245.000" with a "đ" suffix, stores 245000. */
export function PriceInput({ value, onChange, className, ...props }: PriceInputProps) {
  return (
    <div className="relative">
      <Input
        {...props}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value === null ? "" : formatNumber(value)}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "").slice(0, 12);
          onChange(digits ? Number(digits) : null);
        }}
        className={`pr-8 ${className ?? ""}`}
      />
      <span
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-subtle"
        aria-hidden="true"
      >
        đ
      </span>
    </div>
  );
}
