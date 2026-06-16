import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

/** Shared authenticated-area form styles (match the Home marketing inputs). */
export const appFieldClass =
  "mt-1 w-full rounded-xl border border-[#dbe7e0] bg-white px-3.5 py-2.5 text-sm text-[#0c4a35] placeholder:text-[#9aa8a0] focus:border-[#198038] focus:outline-none focus:ring-2 focus:ring-[#198038]/15";

export const appLabelClass = "block text-sm font-medium text-[#0f261c]";

export const appButtonPrimaryClass =
  "rounded-full bg-[#0c6e4f] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0a5c42] disabled:opacity-50";

type FormFieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
  labelProps?: LabelHTMLAttributes<HTMLLabelElement>;
};

export function FormField({ label, htmlFor, error, children, labelProps }: FormFieldProps) {
  return (
    <label htmlFor={htmlFor} className={appLabelClass} {...labelProps}>
      {label}
      {children}
      {error && <span className="mt-1 block text-sm text-[#da1e28]">{error}</span>}
    </label>
  );
}

export function FormInput({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${appFieldClass} ${className}`.trim()} {...props} />;
}

export function FormSelect({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${appFieldClass} ${className}`.trim()} {...props}>
      {children}
    </select>
  );
}

export function FormTextarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${appFieldClass} ${className}`.trim()} {...props} />;
}

export function FormButtonPrimary({
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="submit" className={`${appButtonPrimaryClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
