import { Link } from "react-router-dom";

import EmptyState from "../../components/EmptyState";

export default function Categories() {
  const categories = [
    { id: 1, title: "Fiction" },
    { id: 2, title: "Non-Fiction" },
    { id: 3, title: "Mystery" },
    { id: 4, title: "Thriller" },
    { id: 5, title: "Romance" },
    { id: 6, title: "Science Fiction" },
    { id: 7, title: "Fantasy" },
    { id: 8, title: "Historical Fiction" },
    { id: 9, title: "Biography" },
    { id: 10, title: "Self-Help" },
    { id: 11, title: "Young Adult" },
    { id: 12, title: "Children’s" },
    { id: 13, title: "Horror" },
    { id: 14, title: "Poetry" },
    { id: 15, title: "Classics" },
    { id: 16, title: "Adventure" },
    { id: 17, title: "Crime" },
    { id: 18, title: "Dystopian" },
    { id: 19, title: "Urban Fantasy" },
    { id: 20, title: "Paranormal" },
    { id: 21, title: "Contemporary" },
    { id: 22, title: "Memoir" },
    { id: 23, title: "Autobiography" },
    { id: 24, title: "Historical Romance" },
    { id: 25, title: "Literary Fiction" },
    { id: 26, title: "Graphic Novels" },
    { id: 27, title: "Western" },
    { id: 28, title: "Satire" },
    { id: 29, title: "Humor" },
    { id: 30, title: "Erotica" },
    { id: 31, title: "Science" },
    { id: 32, title: "True Crime" },
    { id: 33, title: "Philosophy" },
    { id: 34, title: "Travel" },
    { id: 35, title: "Cookbooks" },
    { id: 36, title: "Business" },
    { id: 37, title: "Spirituality" },
    { id: 38, title: "Psychological Thriller" },
    { id: 39, title: "Coming-of-Age" },
    { id: 40, title: "Steampunk" },
    { id: 41, title: "Cyberpunk" },
    { id: 42, title: "Post-Apocalyptic" },
    { id: 43, title: "Gothic" },
    { id: 44, title: "Cozy Mystery" },
    { id: 45, title: "Military Fiction" },
    { id: 46, title: "Political Thriller" },
    { id: 47, title: "Epic Fantasy" },
    { id: 48, title: "Dark Fantasy" },
    { id: 49, title: "Magical Realism" },
    { id: 50, title: "Short Stories" },
  ];

  return (
    <div className="flex flex-col gap-8 py-12 animate-fade-up">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold text-primary-white text-balance">
          Browse Categories
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-primary-gray">
          Pick a genre to jump into a focused search shelf.
        </p>
      </header>

      {categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Discovery categories will appear here when they are available."
          actionLabel="Explore books"
          actionTo="/explore"
        />
      ) : (
        <div className="flex flex-wrap gap-3" aria-label="Book categories">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/search/${category.title}`}
              title={`Browse ${category.title} books`}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-secondary-black px-4 py-2 text-center text-sm font-medium text-primary-white shadow-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-secondary-gray hover:shadow-lg focus-visible:outline-accent"
            >
              {category.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
