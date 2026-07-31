"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Label } from "./label";

/** Props the Field wires into whatever control it wraps. */
export type FieldControlProps = {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": boolean | undefined;
  required: boolean | undefined;
  className: string;
};

type FieldProps = {
  label: string;
  /** Leading icon rendered inside the control. */
  icon?: LucideIcon;
  /** Persistent hint. Stays visible — never a placeholder standing in for a label. */
  helper?: string;
  /** Validation message. Presence also flips the control into its invalid state. */
  error?: string | null;
  required?: boolean;
  /** Trailing control, e.g. a password visibility toggle. */
  action?: React.ReactNode;
  className?: string;
  children: (props: FieldControlProps) => React.ReactNode;
};

/**
 * Label + control + helper + error, wired for screen readers.
 *
 * Guarantees on every field it wraps:
 *  - a real `<label for>` bound to the control, never a placeholder-as-label
 *  - the error sits directly below the field it describes
 *  - `aria-describedby` points at helper and error text
 *  - `aria-invalid` tracks the error, and the error is announced via role=alert
 */
export function Field({
  label,
  icon: Icon,
  helper,
  error,
  required,
  action,
  className,
  children,
}: FieldProps) {
  const id = React.useId();
  const helperId = helper ? `${id}-helper` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id}>
          {label}
          {required && (
            <span className="text-danger" aria-hidden="true">
              *
            </span>
          )}
          {required && <span className="sr-only">(আবশ্যক)</span>}
        </Label>
        {action}
      </div>

      <div className="relative">
        {Icon && (
          <Icon
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute left-3.5 top-1/2 z-10 size-[18px] -translate-y-1/2",
              error ? "text-danger" : "text-ink-400"
            )}
          />
        )}

        {children({
          id,
          "aria-describedby": describedBy,
          "aria-invalid": error ? true : undefined,
          required,
          className: cn(Icon && "pl-11"),
        })}
      </div>

      {helper && !error && (
        <p id={helperId} className="text-xs text-ink-500">
          {helper}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-1.5 text-xs font-medium text-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}
