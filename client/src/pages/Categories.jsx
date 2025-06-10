import React from "react";

import { Link } from "react-router-dom";

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
    <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {categories.map((category) => (
        <Link
          key={category?.id}
          to={`/search/${category?.title}`}
          className="bg-[#2D2D2D] hover:bg-[#3C3C3C] transition-colors duration-200 rounded-2xl p-4 flex items-center justify-center text-center"
        >
          <span className="text-[#F5F5F5] text-base font-medium">
            {category?.title}
          </span>
        </Link>
      ))}
    </div>
  );
}
