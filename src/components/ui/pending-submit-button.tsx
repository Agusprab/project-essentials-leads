"use client";

import { useFormStatus } from "react-dom";

type PendingSubmitButtonProps = {
  label: string;
  pendingLabel: string;
  disabled?: boolean;
  className: string;
};

export function PendingSubmitButton({
  label,
  pendingLabel,
  disabled = false,
  className,
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      aria-busy={pending}
      className={className}
    >
      {pending ? (
        <span
          aria-hidden="true"
          className="size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      ) : null}
      <span aria-live="polite">{pending ? pendingLabel : label}</span>
    </button>
  );
}
