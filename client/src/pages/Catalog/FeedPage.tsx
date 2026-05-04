import type { ReactElement } from "react";

import { EmptyState } from "../../components/EmptyState";
import { FeedActivityList } from "../../features/catalog/components/FeedActivityList";
import { feedActivities } from "../../features/catalog/data/feedData";
import { routePaths } from "../../routes";

export default function PublicFeed(): ReactElement {
  return (
    <div className="py-12 flex flex-col gap-8 animate-fade-up">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold text-primary-white text-balance">
          Public Feed
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-primary-gray">
          See what readers are picking up across BookNest.
        </p>
      </header>

      {feedActivities.length === 0 ? (
        <EmptyState
          title="You're all caught up!"
          description="New reading activity will show up here when readers share updates."
          actionLabel="Explore books"
          actionTo={routePaths.explore}
        />
      ) : (
        <FeedActivityList activities={feedActivities} />
      )}
    </div>
  );
}
