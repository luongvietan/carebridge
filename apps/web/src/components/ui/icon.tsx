import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import type { ComponentPropsWithoutRef } from "react";

type IconProps = {
  icon: IconSvgElement;
  size?: number;
  color?: string;
  strokeWidth?: number;
} & Pick<ComponentPropsWithoutRef<"span">, "className" | "aria-hidden" | "aria-label">;

export function Icon({
  icon,
  size = 20,
  color = "currentColor",
  strokeWidth = 1.5,
  className,
  ...props
}: IconProps) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
      {...props}
    />
  );
}

export {
  Add01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  ArrowUpRight01Icon,
  Call02Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  ChevronDownIcon,
  Facebook01Icon,
  InstagramIcon,
  Linkedin01Icon,
  Location01Icon,
  Mail01Icon,
  Menu01Icon,
  MessageQuestionIcon,
  MinusSignIcon,
  NewTwitterIcon,
  QuoteUpIcon,
  StarIcon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
