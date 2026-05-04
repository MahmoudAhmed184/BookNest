import type { ReactElement } from "react";

import { EmptyState } from "../../../components/ui";
import { routePaths } from "../../../routes/paths";

export default function NotFound(): ReactElement {
  return (
    <section className="flex grow flex-col items-center justify-center gap-6 py-16 text-center animate-fade-up">
      <div className="flex max-w-2xl flex-col items-center gap-3">
        <p className="text-sm font-bold uppercase text-primary-gray">Error 404</p>
        <h1 className="display-heading">Page not found</h1>
      </div>
      <EmptyState
        title="This shelf is empty"
        description="The page you wanted is not available anymore. Explore the catalog to keep reading."
        actionLabel="Go to Explore"
        actionTo={routePaths.explore}
        className="py-4"
      />
    </section>
  );
}
