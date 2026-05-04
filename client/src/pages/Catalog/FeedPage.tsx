import React from "react";
import { Link } from "react-router-dom";

export default function PublicFeed() {
  const actions = [
    {
      id: 1,
      username: "Mosab",
      action: "started reading",
      book: {
        id: 1,
        title: "Harry Potter: The Prisoner of Azkaban",
        cover:
          "https://oku.ams3.cdn.digitaloceanspaces.com/covers/2022/08/3862d6e1202f427c0be0ca9ec891be82.jpg",
      },
    },
    {
      id: 2,
      username: "Alice",
      action: "wants to read",
      book: {
        id: 2,
        title: "To Kill a Mockingbird",
        cover:
          "https://oku.ams3.cdn.digitaloceanspaces.com/covers/2022/06/cf9c878d81fcf26ceaa350cbf77aa1f5.jpg",
      },
    },
    {
      id: 3,
      username: "Bob",
      action: "started reading",
      book: {
        id: 3,
        title: "1984",
        cover:
          "https://oku.ams3.cdn.digitaloceanspaces.com/covers/2022/06/0be61269e4fc87209ac3e2a2ecab4abd.jpg",
      },
    },
    {
      id: 4,
      username: "Sarah",
      action: "wants to read",
      book: {
        id: 4,
        title: "Pride and Prejudice",
        cover:
          "https://oku.ams3.cdn.digitaloceanspaces.com/covers/2022/08/3862d6e1202f427c0be0ca9ec891be82.jpg",
      },
    },
    {
      id: 5,
      username: "John",
      action: "started reading",
      book: {
        id: 5,
        title: "The Great Gatsby",
        cover:
          "https://oku.ams3.cdn.digitaloceanspaces.com/covers/2022/06/cf9c878d81fcf26ceaa350cbf77aa1f5.jpg",
      },
    },
    {
      id: 6,
      username: "Emma",
      action: "wants to read",
      book: {
        id: 6,
        title: "Dune",
        cover:
          "https://oku.ams3.cdn.digitaloceanspaces.com/covers/2022/06/0be61269e4fc87209ac3e2a2ecab4abd.jpg",
      },
    },
    {
      id: 7,
      username: "Mike",
      action: "started reading",
      book: {
        id: 7,
        title: "The Da Vinci Code",
        cover:
          "https://oku.ams3.cdn.digitaloceanspaces.com/covers/2022/08/3862d6e1202f427c0be0ca9ec891be82.jpg",
      },
    },
    {
      id: 8,
      username: "Lisa",
      action: "wants to read",
      book: {
        id: 8,
        title: "Gone Girl",
        cover:
          "https://oku.ams3.cdn.digitaloceanspaces.com/covers/2022/06/cf9c878d81fcf26ceaa350cbf77aa1f5.jpg",
      },
    },
    {
      id: 9,
      username: "Tom",
      action: "started reading",
      book: {
        id: 9,
        title: "The Girl with the Dragon Tattoo",
        cover:
          "https://oku.ams3.cdn.digitaloceanspaces.com/covers/2022/06/0be61269e4fc87209ac3e2a2ecab4abd.jpg",
      },
    },
    {
      id: 10,
      username: "Sophie",
      action: "wants to read",
      book: {
        id: 1,
        title: "Harry Potter: The Prisoner of Azkaban",
        cover:
          "https://oku.ams3.cdn.digitaloceanspaces.com/covers/2022/08/3862d6e1202f427c0be0ca9ec891be82.jpg",
      },
    },
  ];

  return (
    <div className="container py-8 flex flex-col gap-8">
      <h2 className="text-md sm:text-xl font-semibold text-primary-white">
        Public Feed
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
        {actions.map((action) => (
          <Link
            key={action.id}
            to={`/book/${action.book.id}`}
            className="group rounded-2xl shadow-md overflow-hidden relative block transition-all duration-300 hover:scale-105 hover:shadow-lg z-10 flex items-center"
          >
            {/* Blurred Background */}
            <div
              className="absolute inset-0 bg-secondary-black transition-opacity duration-300 opacity-100 group-hover:opacity-0 z-0"
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-50 z-0 transition-opacity duration-300"
              style={{
                backgroundImage: `url(${action.book.cover})`,
                backgroundBlendMode: "overlay",
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(50px)",
              }}
              aria-hidden="true"
            />
            {/* Card Content */}
            <div className="flex items-center gap-4 p-4 sm:p-6 relative z-10 w-full">
              {/* Book Cover */}
              <div className="flex-shrink-0">
                <img
                  src={action.book.cover}
                  alt={`${action.book.title} cover`}
                  className="h-[120px] w-[80px] object-cover rounded-lg transition-transform duration-300 group-hover:-translate-y-2"
                  style={{
                    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                  }}
                />
              </div>
              {/* Action Text */}
              <div className="flex flex-col justify-center gap-1">
                <p className="text-sm sm:text-base text-primary-white font-semibold">
                  @{action.username}
                </p>
                <p className="text-sm text-primary-gray">
                  {action.action}{" "}
                  <span className="text-primary-white">
                    {action.book.title}
                  </span>
                </p>
              </div>
            </div>
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-accent-v/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
          </Link>
        ))}
      </div>
    </div>
  );
}
