import type { FormErrorState } from "../../lib/form-errors";

export function FormErrorBanner({ error }: { error: FormErrorState | null }) {
  if (!error) return null;
  return (
    <p className="error sf-form-error" role="alert">
      {error.message}
      {error.fields.length > 0 && (
        <span className="sf-form-error-fields"> Highlighted fields need attention.</span>
      )}
    </p>
  );
}
