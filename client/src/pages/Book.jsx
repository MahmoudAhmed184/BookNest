import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProfileImage from "/user_profile.png";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, A11y, Autoplay } from "swiper/modules";

import toast from "react-hot-toast";

import {
  getBook,
  getReviews,
  createReview,
  createRating,
  getBookRatings,
} from "../services/bookService";
import { getCollections, addToCollection } from "../services/collectionService";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function BookPage() {
  const { id } = useParams();
  const [listId, setListId] = useState(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const queryClient = useQueryClient();

  const { data: collections } = useQuery({
    queryKey: ["collections"],
    queryFn: () => getCollections(localStorage.getItem("token")),
  });

  useEffect(() => {
    if (collections && collections.length > 0) {
      setListId(collections[0].list_id);
    }
  }, [collections]);

  const {
    data: book,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["book", id],
    queryFn: () => getBook(id),
  });

  const addBookMutation = useMutation({
    mutationFn: () => addToCollection({ book_id: id, list_id: listId }),
    onSuccess: () => {
      toast.success("Successfully added to library", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
    },
    onError: (error) => {
      toast.error(error, {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: () =>
      createReview({ user: 31, book: id, review_text: reviewText }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", id] });
    },
    onError: (error) => {
      toast.error("Failed to submit review", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
    },
  });

  const ratingMutation = useMutation({
    mutationFn: () => createRating({ book: id, rate: rating, user: 31 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book", id] });
    },
    onError: (error) => {
      console.error("Rating failed:", error);
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ["reviews", id],
    queryFn: () => getReviews(id),
  });

  const { data: ratings } = useQuery({
    queryKey: ["ratings", id],
    queryFn: () => getBookRatings(id),
    refetchInterval: 5000,
  });

  const handleStarClick = (rating) => {
    setRating(rating);
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!reviewText || !rating) {
      toast.error("You need to provide both rating and review", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
      return;
    }

    reviewMutation.mutate();
    ratingMutation.mutate();
    toast.success("Review submitted!", {
      style: {
        borderRadius: "10px",
        background: "#333",
        color: "#fff",
      },
    });
  };

  if (isLoading)
    return (
      <div className="flex-grow flex justify-center items-center">
        <div className="spinner"></div>
      </div>
    );
  if (error) return <p>Error fetching book</p>;

  return (
    <div className="py-md flex flex-col gap-md">
      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        <div className="w-full max-w-[300px] mx-auto md:mx-0">
          <div className="group rounded-2xl shadow-md overflow-hidden relative transition-all hover:scale-105">
            <div
              className="absolute inset-0 bg-secondary-black transition-opacity duration-300 opacity-100 group-hover:opacity-0 z-0"
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-50 z-0 transition-all duration-1000"
              style={{
                backgroundImage: `url(${book?.cover_img})`,
                backgroundBlendMode: "overlay",
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(50px)",
              }}
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-secondary-black/80 to-transparent z-10" />
            <img
              src={
                book?.cover_img ||
                `https://dhmckee.com/wp-content/uploads/2018/11/defbookcover-min.jpg`
              }
              alt={`${book?.title} cover`}
              className="w-full h-[400px] object-cover relative z-20"
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <h1 className="text-3xl font-semibold text-primary-white">
            {book?.title}
          </h1>
          <p className="text-lg text-primary-gray">
            by{" "}
            <span className="text-primary-white">
              {book?.authors?.map((author) => author.name).join(", ")}
            </span>
          </p>
          <div className="flex items-center gap-2 text-sm text-primary-gray">
            <span className="text-yellow-400">★</span>
            {book?.average_rate || 0} / 5.0 ({book?.number_of_ratings || 0})
          </div>
          <button
            onClick={() => addBookMutation.mutate()}
            className="btn btn-accent-v px-4 py-2 rounded-md text-primary-white"
          >
            Add to Library
          </button>
          <div className="text-sm text-primary-gray">
            <p>
              <span className="text-primary-white">Release Date:</span>{" "}
              {book?.publication_date}
            </p>
            <p>
              <span className="text-primary-white">Pages:</span>{" "}
              {book?.number_of_pages}
            </p>
            {book?.language ? (
              <p>
                <span className="text-primary-white">Language:</span>{" "}
                {book?.language}
              </p>
            ) : null}
            <p>
              <span className="text-primary-white">ISBN:</span> {book?.isbn13}
            </p>
            <p className="text-primary-white">
              Category:{" "}
              <span className="text-primary-gray">
                {book?.genres?.map((genre) => genre).join(", ")}
              </span>
            </p>
          </div>
          <h2 className="text-xl font-semibold text-primary-white">
            Description
          </h2>
          <p className="text-base text-primary-white">{book?.description}</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmitReview}
        className="bg-secondary-black p-4 rounded-md flex flex-col gap-3"
      >
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleStarClick(star)}
              className="text-lg"
            >
              <span
                className={`${
                  rating >= star ? "text-yellow-400 font-bold" : "text-white"
                }`}
              >
                ★
              </span>
            </button>
          ))}
        </div>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          className="bg-primary-black text-primary-white p-2 rounded min-h-32"
          placeholder="Write your review here..."
        />
        <button
          type="submit"
          className="btn btn-accent-v text-white rounded-md px-4 py-2"
        >
          Submit Review
        </button>
      </form>

      {reviews?.map((review, i) => (
        <div
          key={review?.review_id}
          className="bg-secondary-black p-4 rounded-md text-primary-white"
        >
          <div className="flex justify-between">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Link
                  to={`/profile/${review.profile_id}`}
                  className="w-8 h-8 rounded-full overflow-hidden bg-primary-gray"
                >
                  {review?.profile_pic ? (
                    <img
                      src={
                        review?.profile_pic?.endsWith("image")
                          ? `${review.profile_pic}.svg`
                          : review?.profile_pic
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </Link>
                <strong>
                  <Link to={`/profile/${review.profile_id}`}>
                    {review?.username}
                  </Link>
                </strong>
              </div>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`${
                    ratings && ratings[i]?.rate >= star
                      ? "text-yellow-400 font-bold"
                      : "text-white"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
          <p className="mt-2 text-sm">{review?.review_text}</p>
          <div className="flex items-center gap-2 text-xs mt-2 text-primary-gray">
            <span>{review?.created_at}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
