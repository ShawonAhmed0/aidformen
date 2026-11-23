"use client";

import { Printer } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

/**
 * Opens the browser's print dialog, where "Save as PDF" produces the PDF
 * report. The browser lays out the Bengali itself — server-side PDF libraries
 * do not shape Bengali conjuncts, so they would print broken text.
 */
export function PrintButton({ label }: { label: string }) {
    return (
        <button
            type="button"
            onClick={() => window.print()}
            className={buttonVariants({ variant: "outline" })}
        >
            <Printer aria-hidden="true" />
            {label}
        </button>
    );
}
