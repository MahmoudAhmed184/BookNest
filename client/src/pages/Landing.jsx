import React from "react";
import Logo from "/logo.svg";
import ManInTheDark from "/man-in-the-dark.jpg";
import HighlightedQuote from "/highlighted-quote.jpg";

import { Link } from "react-router-dom";

export default function Landing() {
  return (
    // <section className="snap-section min-h-screen bg-primary-black text-primary-white flex items-center justify-center pt-16 pb-24">
    //   <div className="container px-4 sm:px-6 py-8 flex flex-col items-center justify-center gap-6 sm:gap-8 text-center relative">
    //     {/* Blurry Animated Background */}
    //     <div
    //       className="absolute inset-0 opacity-30 animate-blur-shift z-0"
    //       style={{
    //         background: `radial-gradient(circle, #CFC8B8 0%, transparent 70%)`,
    //         filter: "blur(100px)",
    //       }}
    //       aria-hidden="true"
    //     />
    //     <img
    //       src={Logo}
    //       alt="BookNest Logo"
    //       className="w-24 sm:w-32 md:w-40 relative z-10"
    //     />
    //     <h1 className="text-2xl sm:text-3xl md:text-4xl text-accent-v bg-clip-text text-transparent font-semibold relative z-10">
    //       Discover Your Next Favorite Book
    //     </h1>
    //     <p className="text-sm sm:text-base md:text-lg text-primary-gray max-w-md sm:max-w-lg md:max-w-2xl relative z-10">
    //       Dive into a world of stories tailored just for you. Connect with
    //       fellow book lovers, track your reading journey, and uncover hidden
    //       gems from every genre.
    //     </p>
    //     <div className="flex flex-wrap justify-center gap-3 sm:gap-4 relative z-10">
    //       <button className="btn btn-accent-v px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium rounded-md text-primary-white hover:bg-primary-v/80 transition-colors">
    //         Get Started
    //       </button>
    //       <button className="btn btn-primary-v px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium rounded-md text-primary-white hover:bg-secondary-gray/80 transition-colors">
    //         Learn More
    //       </button>
    //     </div>
    //   </div>
    // </section>
    <section className="flex-grow flex flex-col items-center justify-center gap-md relative">
      <div className="blob"></div>
      <img
        src={Logo}
        alt="BookNest Logo"
        className="w-24 sm:w-32 md:w-32 relative z-10"
      />
      <h1 className="text-2xl sm:text-3xl md:text-4xl text-accent-v bg-clip-text text-transparent font-semibold text-center z-10">
        Discover Your Next Favorite Book
      </h1>
      <p className="text-sm sm:text-base md:text-lg text-primary-gray max-w-md sm:max-w-lg md:max-w-2xl relative text-center z-10">
        Dive into a world of stories tailored just for you. Connect with fellow
        book lovers, track your reading journey, and uncover hidden gems from
        every genre.
      </p>
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4 relative z-10">
        <Link
          to={"/login"}
          className="btn btn-accent-v px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium rounded-md text-primary-white hover:bg-primary-v/80 transition-colors"
        >
          Get Started
        </Link>
        <Link
          to={"/explore"}
          className="btn btn-primary-v px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium rounded-md text-primary-white hover:bg-secondary-gray/80 transition-colors"
        >
          Explore Now
        </Link>
      </div>
    </section>
  );
}
