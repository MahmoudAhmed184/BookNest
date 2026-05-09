import type { ReactElement } from "react";

import type { PasswordRequirement } from "./passwordRequirements";

interface PasswordStrength {
  label: string;
  width: string;
  barClassName: string;
  textClassName: string;
}

function getPasswordStrength(
  requirements: PasswordRequirement[]
): PasswordStrength {
  const metCount = requirements.filter((requirement) => requirement.isMet).length;

  if (metCount <= 1) {
    return {
      label: "Needs work",
      width: "20%",
      barClassName: "bg-destructive",
      textClassName: "text-destructive",
    };
  }

  if (metCount === 2) {
    return {
      label: "Fair",
      width: "50%",
      barClassName: "bg-warning",
      textClassName: "text-warning",
    };
  }

  if (metCount === 3) {
    return {
      label: "Good",
      width: "75%",
      barClassName: "bg-info",
      textClassName: "text-info",
    };
  }

  return {
    label: "Strong",
    width: "100%",
    barClassName: "bg-success",
    textClassName: "text-success",
  };
}

function RequirementIcon({ isMet }: { isMet: boolean }): ReactElement {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
        isMet
          ? "border-success bg-success/15 text-success"
          : "border-secondary-gray bg-primary-black/35 text-primary-gray"
      }`}
      aria-hidden="true"
    >
      {isMet ? (
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
          <path
            d="m3.3 8.2 2.8 2.8 6.6-6.7"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      )}
    </span>
  );
}

export function PasswordQualityPanel({
  requirements,
}: {
  requirements: PasswordRequirement[];
}): ReactElement {
  const strength = getPasswordStrength(requirements);

  return (
    <div
      className="rounded-lg border border-secondary-gray/55 bg-primary-black/25 p-4"
      aria-label={`Password strength: ${strength.label}`}
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-primary-white">
          Password strength
        </p>
        <span className={`text-sm font-semibold ${strength.textClassName}`}>
          {strength.label}
        </span>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-secondary-gray/45"
        aria-hidden="true"
      >
        <span
          className={`block h-full rounded-full transition-all duration-300 ease-out ${strength.barClassName}`}
          style={{ width: strength.width }}
        />
      </div>
      <ul className="mt-4 grid gap-2 text-sm text-primary-gray sm:grid-cols-2">
        {requirements.map((requirement) => (
          <li key={requirement.id} className="flex items-start gap-2">
            <RequirementIcon isMet={requirement.isMet} />
            <span
              className={
                requirement.isMet ? "font-medium text-primary-white" : undefined
              }
            >
              {requirement.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
