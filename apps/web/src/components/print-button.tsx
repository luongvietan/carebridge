"use client";

export function PrintButton({ label = "Download / Print", className = "" }: { label?: string; className?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={className}>
      {label}
    </button>
  );
}
