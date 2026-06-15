import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

/** Shared authenticated-area form styles (Carbon-inspired underline fields). */
export const appFieldClass =
  "mt-1 w-full rounded-none border-b border-[#8c8c8c] bg-[#f4f4f4] px-3 py-2 text-sm text-[#161616] focus:border-[#198038] focus:outline-none";

export const appLabelClass = "block text-sm font-medium text-[#161616]";

export const appButtonPrimaryClass =
  "bg-[#198038] px-4 py-3 text-sm text-white hover:bg-[#0e6027] disabled:opacity-50";

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
