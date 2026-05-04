import { useState, type ReactElement } from "react";
import ProfileImage from "/william_shakespere.jpg";

import {
  AuthorBio,
  AuthorBooks,
  AuthorHeader,
} from "../../features/catalog/components/AuthorSections";
import { featuredAuthorBooks } from "../../features/catalog/data/authorData";

export default function Author(): ReactElement {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className="py-12 flex flex-col gap-12 animate-fade-up">
      <AuthorHeader
        isLiked={isLiked}
        onToggleLike={() => setIsLiked((current) => !current)}
        profileImage={ProfileImage}
      />
      <AuthorBio />
      <AuthorBooks books={featuredAuthorBooks} />
    </div>
  );
}
