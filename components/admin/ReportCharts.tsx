import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Small, dependency-free charts for the admin Reports page. Server-rendered;
 * hover and keyboard focus show each value through CSS alone, and every chart
 * keeps a table view so no value depends on hovering.
 *
 * One series each, so one brand hue and no legend box (the card title names
 * what is plotted). Heat tables use a single-hue light→dark ramp.
 */

/** 1, 2 or 5 × 10ⁿ at or above `n`, so axis ticks land on clean numbers. */
function niceCeil(n: number) {
  if (n <= 4) return 4;
  const power = 10 ** Math.floor(Math.log10(n));
  const step = [1, 2, 5, 10].find((m) => m * power >= n) ?? 10;
  return step * power;
}

type Point = {
  label: string;
  /** Full name for the tooltip and table, e.g. "November 2026". */
  name: string;
  value: number | null;
  href?: string;
};

function Ticks({ max, format }: { max: number; format: (n: number) => string }) {
  return (
    <>
      {[0, 0.5, 1].map((share) => (
        <div
          key={share}
          className="pointer-events-none absolute inset-x-0 border-t border-ink-200"
          style={{ bottom: `${share * 100}%` }}
        >
          <span className="absolute -left-1 -translate-x-full -translate-y-1/2 text-2xs tabular-nums text-ink-500">
            {format(Math.round(max * share))}
          </span>
        </div>
      ))}
    </>
  );
}

function Tooltip({ value, name }: { value: string; name: string }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1.5 text-center shadow-lg group-hover:block group-focus-visible:block"
    >
      <span className="block text-sm font-semibold text-white">{value}</span>
      <span className="block text-2xs text-white/75">{name}</span>
    </span>
  );
}

function TableView({
  points,
  format,
  label,
}: {
  points: Point[];
  format: (n: number) => string;
  label: string;
}) {
  return (
    <details className="mt-4 text-sm" data-print-hide>
      <summary className="cursor-pointer text-brand-700 hover:text-brand-800">{label}</summary>
      <table className="mt-2 w-full max-w-sm text-left">
        <tbody>
          {points
            .filter((p) => p.value !== null)
            .map((p) => (
              <tr key={p.name} className="border-b border-ink-100">
                <th scope="row" className="py-1.5 font-normal text-ink-600">
                  {p.name}
                </th>
                <td className="py-1.5 text-end tabular-nums text-ink-900">
                  {format(p.value ?? 0)}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </details>
  );
}

/** Vertical bars from one baseline. Columns past today (null) draw nothing. */
export function ColumnChart({
  points,
  format,
  unit,
  tableLabel,
}: {
  points: Point[];
  format: (n: number) => string;
  /** Word after the value in the tooltip, e.g. "chats". */
  unit: (n: number) => string;
  tableLabel: string;
}) {
  const values = points.map((p) => p.value ?? 0);
  const peak = Math.max(...values);
  const max = niceCeil(peak);
  const peakIndex = values.indexOf(peak);

  return (
    <div>
      <div className="relative ms-9 h-44">
        <Ticks max={max} format={format} />
        <div className="absolute inset-0 flex">
          {points.map((p, i) => {
            const share = p.value ? p.value / max : 0;
            const body = (
              <>
                {p.value !== null && p.value > 0 && (
                  <span
                    className="w-full max-w-6 rounded-t-[4px] bg-brand-600 transition-ui group-hover:bg-brand-500 group-focus-visible:bg-brand-500"
                    style={{ height: `max(${share * 100}%, 2px)` }}
                  />
                )}
                {i === peakIndex && peak > 0 && (
                  <span
                    className="absolute left-1/2 -translate-x-1/2 text-2xs font-semibold tabular-nums text-ink-700"
                    style={{ bottom: `calc(${share * 100}% + 4px)` }}
                  >
                    {format(peak)}
                  </span>
                )}
                {p.value !== null && (
                  <Tooltip value={`${format(p.value)} ${unit(p.value)}`} name={p.name} />
                )}
              </>
            );
            const className =
              "group relative flex h-full flex-1 flex-col items-center justify-end px-[2px] outline-none";
            const label = p.value === null ? p.name : `${p.name}: ${format(p.value)} ${unit(p.value)}`;
            return p.href && p.value !== null ? (
              <Link key={p.name} href={p.href} aria-label={label} className={className}>
                {body}
              </Link>
            ) : (
              <div key={p.name} aria-label={label} tabIndex={p.value === null ? undefined : 0} className={className}>
                {body}
              </div>
            );
          })}
        </div>
      </div>
      <div className="ms-9 mt-2 flex" aria-hidden="true">
        {points.map((p) => (
          <span key={p.name} className="flex-1 text-center text-2xs text-ink-500">
            {p.label}
          </span>
        ))}
      </div>
      <TableView points={points} format={format} label={tableLabel} />
    </div>
  );
}

/** A running total over the months, with a crosshair readout per month. */
export function GrowthLine({
  points,
  format,
  unit,
  tableLabel,
}: {
  points: Point[];
  format: (n: number) => string;
  unit: (n: number) => string;
  tableLabel: string;
}) {
  const n = points.length;
  const drawn = points
    .map((p, i) => ({ ...p, i }))
    .filter((p): p is Point & { i: number; value: number } => p.value !== null);
  const max = niceCeil(Math.max(0, ...drawn.map((p) => p.value)));
  const x = (i: number) => ((i + 0.5) / n) * 100;
  const y = (v: number) => 100 - (v / max) * 100;
  const line = drawn.map((p) => `${x(p.i)},${y(p.value)}`).join(" ");
  const last = drawn.at(-1);

  return (
    <div>
      <div className="relative ms-9 h-44">
        <Ticks max={max} format={format} />
        {drawn.length > 0 && (
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 size-full overflow-visible"
            aria-hidden="true"
          >
            <polygon
              points={`${x(drawn[0].i)},100 ${line} ${x(drawn.at(-1)!.i)},100`}
              className="fill-brand-700/10"
            />
            <polyline
              points={line}
              fill="none"
              className="stroke-brand-700"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}
        {drawn.map((p) => (
          <span
            key={p.name}
            aria-hidden="true"
            className="pointer-events-none absolute size-2.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-brand-700 ring-2 ring-surface"
            style={{ left: `${x(p.i)}%`, bottom: `${100 - y(p.value)}%` }}
          />
        ))}
        {last && (
          <span
            className="absolute -translate-x-1/2 text-2xs font-semibold tabular-nums text-ink-700"
            style={{ left: `${x(last.i)}%`, bottom: `calc(${100 - y(last.value)}% + 10px)` }}
          >
            {format(last.value)}
          </span>
        )}
        {/* One hit column per month: the reader aims at a month, not a 2px line. */}
        <div className="absolute inset-0 flex">
          {points.map((p) =>
            p.value === null ? (
              <span key={p.name} className="flex-1" />
            ) : (
              <div
                key={p.name}
                tabIndex={0}
                aria-label={`${p.name}: ${format(p.value)} ${unit(p.value)}`}
                className="group relative flex-1 outline-none"
              >
                <span className="absolute inset-y-0 left-1/2 hidden w-px bg-ink-300 group-hover:block group-focus-visible:block" />
                <Tooltip value={`${format(p.value)} ${unit(p.value)}`} name={p.name} />
              </div>
            )
          )}
        </div>
      </div>
      <div className="ms-9 mt-2 flex" aria-hidden="true">
        {points.map((p) => (
          <span key={p.name} className="flex-1 text-center text-2xs text-ink-500">
            {p.label}
          </span>
        ))}
      </div>
      <TableView points={points} format={format} label={tableLabel} />
    </div>
  );
}

const HEAT = [
  "bg-brand-100 text-ink-900",
  "bg-brand-200 text-ink-900",
  "bg-brand-400 text-ink-900",
  "bg-brand-700 text-white",
];

/**
 * A table whose cells are shaded by count — light to dark in one hue. The
 * numbers stay printed in every cell, so the shade is never the only channel.
 */
export function HeatTable({
  caption,
  rows,
  columns,
  format,
  less,
  more,
}: {
  caption: string;
  rows: { label: string; values: number[] }[];
  columns: string[];
  format: (n: number) => string;
  less: string;
  more: string;
}) {
  const max = Math.max(1, ...rows.flatMap((r) => r.values));
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-max border-separate border-spacing-[2px] text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th scope="col" />
              {columns.map((c) => (
                <th key={c} scope="col" className="px-1.5 pb-1 text-center text-2xs font-medium text-ink-500">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row" className="whitespace-nowrap pe-3 text-start text-sm font-medium text-ink-800">
                  {row.label}
                </th>
                {row.values.map((v, i) => (
                  <td
                    key={columns[i]}
                    title={`${row.label} · ${columns[i]}: ${format(v)}`}
                    className={cn(
                      "h-9 min-w-10 rounded-[4px] px-1.5 text-center tabular-nums",
                      v === 0 ? "bg-ink-100/60 text-ink-400" : HEAT[Math.min(3, Math.ceil((v / max) * 4) - 1)]
                    )}
                  >
                    {v === 0 ? "·" : format(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-2xs text-ink-500" aria-hidden="true">
        {less}
        {HEAT.map((h) => (
          <span key={h} className={cn("h-3 w-6 rounded-[3px]", h.split(" ")[0])} />
        ))}
        {more}
      </div>
    </div>
  );
}

/** Horizontal bars with count and share, for one breakdown. */
export function BarList({
  rows,
  total,
  format,
  percent,
}: {
  rows: { label: string; value: number }[];
  total: number;
  format: (n: number) => string;
  percent: (share: number) => string;
}) {
  return (
    <ul className="space-y-1">
      {rows.map((row) => {
        const share = total ? row.value / total : 0;
        return (
          <li
            key={row.label}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 px-1 py-2 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)_5.5rem]"
          >
            <span className="text-sm font-medium text-ink-800">{row.label}</span>
            <span className="text-end text-sm tabular-nums text-ink-600 sm:order-last">
              <span className="font-semibold text-ink-900">{format(row.value)}</span> · {percent(share)}
            </span>
            <span className="col-span-2 h-2 overflow-hidden rounded-full bg-ink-100 sm:col-span-1">
              <span
                className="block h-full rounded-full bg-brand-600"
                style={{ width: `${row.value ? Math.max(2, share * 100) : 0}%` }}
              />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
