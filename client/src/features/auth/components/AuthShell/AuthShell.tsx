import type { ReactElement, ReactNode } from "react";

import Logo from "/logo.svg";

export interface AuthShellProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function AuthShell({
  title,
  description,
  children,
}: AuthShellProps): ReactElement {
  return (
    <section className="auth-gradient-bg relative left-1/2 flex min-h-[calc(100vh-10rem)] w-screen -translate-x-1/2 items-center justify-center px-4 py-12 animate-fade-up">
      <div className="glass-card w-full max-w-md p-6 sm:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <img
              className="h-16 w-16 transition-transform duration-200 ease-out hover:scale-105"
              src={Logo}
              alt="BookNest logo"
              width="64"
              height="64"
            />
            <h1 className="display-heading text-3xl md:text-4xl">{title}</h1>
            <p className="text-sm leading-relaxed text-primary-gray">
              {description}
            </p>
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}

export default AuthShell;
