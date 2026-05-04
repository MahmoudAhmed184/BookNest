export interface FeedActivity {
  id: number;
  username: string;
  action: string;
  timestamp: string;
  book: {
    id: number;
    title: string;
    cover: string;
  };
}

export const feedActivities: FeedActivity[] = [
  {
    id: 1,
    username: "Mosab",
    action: "started reading",
    timestamp: "Just now",
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
    timestamp: "12 min ago",
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
    timestamp: "25 min ago",
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
    timestamp: "42 min ago",
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
    timestamp: "1 hr ago",
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
    timestamp: "2 hrs ago",
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
    timestamp: "3 hrs ago",
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
    timestamp: "4 hrs ago",
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
    timestamp: "Yesterday",
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
    timestamp: "Yesterday",
    book: {
      id: 1,
      title: "Harry Potter: The Prisoner of Azkaban",
      cover:
        "https://oku.ams3.cdn.digitaloceanspaces.com/covers/2022/08/3862d6e1202f427c0be0ca9ec891be82.jpg",
    },
  },
];
