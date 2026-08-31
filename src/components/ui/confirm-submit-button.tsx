"use client";

import { useFormStatus } from "react-dom";

import { SendIcon, TrashIcon } from "@/components/ui/icons";

type ConfirmSubmitButtonProps = {
  label: string;
  confirmMessage: string;
  variant?: "danger" | "neutral";
  icon?: "send" | "trash";
  disabled?: boolean;
  pendingLabel?: string;
};

export function ConfirmSubmitButton({
  label,
  confirmMessage,
  variant = "danger",
  icon,
  disabled = false,
  pendingLabel = "Memproses...",
}: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;
  const className =
    variant === "danger"
      ? "border-[#FECDCA] text-[#B42318] hover:bg-[#FEF3F2]"
      : "border-[#D9E0EA] text-[#344054] hover:bg-[#F8FAFC]";

  return (
    <button
      type="submit"
      disabled={isDisabled}
      aria-busy={pending}
      onClick={(event) => {
        if (isDisabled) {
          event.preventDefault();
          return;
        }

        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition ${className} disabled:pointer-events-none disabled:border-[#D9E0EA] disabled:text-[#98A2B3]`}
    >
      {pending ? <PendingSpinner /> : null}
      {!pending && icon === "send" ? <SendIcon className="size-4" /> : null}
      {!pending && icon === "trash" ? <TrashIcon className="size-4" /> : null}
      {pending ? pendingLabel : label}
    </button>
  );
}

function PendingSpinner() {
  return (
    <span
      aria-hidden="true"
      className="size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
    />
  );
}
