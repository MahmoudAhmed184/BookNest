import type { ReactElement } from "react";
import { useParams } from "react-router-dom";

import { ErrorState } from "../../../components/ui";
import {
  AuthorBio,
  AuthorBooks,
  AuthorHeader,
} from "../components/AuthorSections";
import { BookPageSkeleton } from "../components/BookPageSections";
import { useAuthorPageData } from "../hooks/useAuthorPageData";
import { useOptionalAuth } from "../../auth/hooks/useOptionalAuth";

interface AuthorRouteParams {
  [key: string]: string | undefined;
  id: string;
}

export default function Author(): ReactElement {
  const { id } = useParams<AuthorRouteParams>();
  const { token } = useOptionalAuth();
  const {
    author,
    books,
    isLiked,
    isAuthorLoading,
    isAuthorFetching,
    isAuthorError,
    isBooksLoading,
    isBooksError,
    isTogglingLike,
    toggleAuthorLike,
    refetchAuthor,
    refetchBooks,
  } = useAuthorPageData(id, token);

  if (isAuthorLoading || isBooksLoading) return <BookPageSkeleton />;

  if (isAuthorError || !author) {
    return (
      <div className="py-12">
        <ErrorState
          title="Author details are unavailable"
          message="We could not load this author right now."
          onRetry={refetchAuthor}
          isRetrying={isAuthorFetching}
        />
      </div>
    );
  }

  return (
    <div className="py-12 flex flex-col gap-12 animate-fade-up">
      <AuthorHeader
        author={author}
        isLiked={isLiked}
        isLikePending={isTogglingLike}
        onToggleLike={toggleAuthorLike}
      />
      <AuthorBio author={author} />
      {isBooksError ? (
        <ErrorState
          title="Author books are unavailable"
          message="We could not load books for this author."
          onRetry={refetchBooks}
        />
      ) : (
        <AuthorBooks books={books} />
      )}
    </div>
  );
}
