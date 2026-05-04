import type { ReactElement } from "react";

export interface SectionTitleProps {
  id: string;
  children: string;
}

export function SectionTitle({ id, children }: SectionTitleProps): ReactElement {
  return (
    <h2 id={id} className="text-xl font-bold text-primary-white text-balance sm:text-2xl">
      {children}
    </h2>
  );
}
