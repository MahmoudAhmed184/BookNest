import React from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  getProfile,
  getUserReviews,
  getUserRatings,
} from "../services/userService";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, A11y, Autoplay } from "swiper/modules";
import { getUserCollections } from "../services/collectionService";

export default function UserProfile() {
  const { id } = useParams();

  const {
    data: user,
    isLoading: isUserLoading,
    isError: isUserError,
  } = useQuery({
    queryKey: ["user", id],
    queryFn: () => getProfile(id),
    enabled: !!id,
  });

  const {
    data: reviews,
    isLoading: isReviewsLoading,
    isError: isReviewsError,
  } = useQuery({
    queryKey: ["reviews", id],
    queryFn: () => getUserReviews(user?.user_id),
    enabled: !!user?.user_id,
  });

  const {
    data: ratings,
    isLoading: isRatingsLoading,
    isError: isRatingsError,
  } = useQuery({
    queryKey: ["ratings", id],
    queryFn: () => getUserRatings(user?.user_id),
    enabled: !!user?.user_id,
  });

  const { data: collections } = useQuery({
    queryKey: ["collections"],
    queryFn: () => getUserCollections(user?.user_id),
    enabled: !!user?.user_id,
  });

  if (isUserLoading || isReviewsLoading || isRatingsLoading) {
    return (
      <div className="flex-grow flex justify-center items-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (isUserError || isReviewsError || isRatingsError) {
    return <p>Error loading user data or reviews.</p>;
  }

  return (
    <div className="flex flex-col gap-md py-md">
      {/* Profile Section */}
      <div className="flex flex-col items-center md:flex-row gap-4 md:items-end">
        <div className="w-64 md:w-64 aspect-square overflow-hidden rounded-lg bg-secondary-black">
          {user?.profile_pic ? (
            <img
              src={
                user?.profile_pic?.endsWith("image")
                  ? `${user.profile_pic}.svg`
                  : user?.profile_pic
              }
              alt={`${user?.username}'s profile image`}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : null}
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold">{user?.username}</h2>
          <button
            type="button"
            className="btn btn-accent-v px-4 py-2 text-sm font-medium rounded-md"
            aria-label={`Follow ${user?.username}`}
          >
            Follow
          </button>
        </div>
      </div>

      {/* Bio Section */}
      <h2 className="text-md sm:text-xl font-semibold">Bio</h2>
      <p className="text-base leading-relaxed">{user?.bio}</p>

      <h2
        key={collections[0]?.list_id}
        className="text-md sm:text-xl font-semibold"
      >
        My Books
      </h2>
      <div key={collections[0]?.id}>
        <Swiper
          modules={[Navigation, Pagination, A11y, Autoplay]}
          spaceBetween={20}
          slidesPerView={1}
          navigation={{
            prevEl: ".swiper-button-prev",
            nextEl: ".swiper-button-next",
          }}
          pagination={{ clickable: true }}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          breakpoints={{
            640: { slidesPerView: 2, spaceBetween: 20 },
            1024: { slidesPerView: 3, spaceBetween: 30 },
            1280: { slidesPerView: 4, spaceBetween: 40 },
          }}
          className="w-full relative"
        >
          {collections[0]?.books?.length === 0 ? (
            <p className="text-base text-primary-gray">No books added yet.</p>
          ) : (
            collections[0]?.books?.map((book) => (
              <SwiperSlide key={book.isbn13}>
                <div className="relative">
                  <Link
                    to={`/book/${book?.isbn13}`}
                    className="group rounded-2xl shadow-md overflow-hidden relative block"
                  >
                    <div
                      className="absolute inset-0 bg-secondary-black transition-opacity duration-300 opacity-100 group-hover:opacity-0 z-0"
                      aria-hidden="true"
                    />
                    <img
                      src={
                        book?.cover_img ||
                        `https://dhmckee.com/wp-content/uploads/2018/11/defbookcover-min.jpg`
                      }
                      className="absolute inset-0 w-full h-full object-cover blur-[100px] opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-0 peer"
                      aria-hidden="true"
                      draggable={false}
                    />
                    <figure className="flex flex-col justify-center items-center gap-4 sm:gap-5 p-4 sm:p-6 relative z-10">
                      <div className="book-cover h-[256px] sm:h-[280px] relative">
                        <img
                          src={
                            book?.cover_img ||
                            `https://dhmckee.com/wp-content/uploads/2018/11/defbookcover-min.jpg`
                          }
                          alt={book?.title}
                          className="w-[180px] h-[280px] object-cover rounded-2xl relative transition-transform duration-300 group-hover:-translate-y-4 z-20 peer"
                        />
                      </div>
                      <figcaption className="flex flex-col justify-center items-center gap-2 sm:gap-3">
                        <h4 className="text-base sm:text-lg text-primary-white font-semibold text-center line-clamp-1">
                          {book?.title}
                        </h4>
                        <h5 className="text-sm sm:text-base text-primary-gray text-center">
                          {book?.author}
                        </h5>
                      </figcaption>
                    </figure>
                  </Link>
                </div>
              </SwiperSlide>
            ))
          )}

          <div className="swiper-button-prev"></div>
          <div className="swiper-button-next"></div>
        </Swiper>
      </div>

      {/* Reviews Section */}
      <h2 className="text-md sm:text-xl font-semibold">Reviews</h2>
      {reviews?.length === 0 ? (
        <p className="text-base text-primary-gray">No reviews yet.</p>
      ) : (
        reviews?.map((review, i) => {
          return (
            <div
              key={review?.review_id}
              className="bg-secondary-black p-4 rounded-md text-primary-white mb-4"
            >
              <div className="flex justify-between">
                <div className="flex  gap-md flex-grow">
                  <div className="min-w-36 h-52 rounded-xl overflow-hidden bg-primary-gray transition-all hover:scale-105">
                    {review?.profile_pic ? (
                      <Link to={`/book/${review?.book}`}>
                        <img
                          src={
                            review?.book_cover ||
                            `https://dhmckee.com/wp-content/uploads/2018/11/defbookcover-min.jpg`
                          }
                          className="w-full h-full object-cover"
                          alt="Reviewer profile"
                        />
                      </Link>
                    ) : null}
                  </div>
                  <div className="flex flex-col justify-between flex-grow">
                    <div className="flex flex-col w-full flex-grow">
                      <div className="flex justify-between gap-md">
                        <strong>{review?.book_title}</strong>
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
                    </div>
                    <div className="flex items-center gap-2 text-xs mt-2 text-primary-gray">
                      <span>{review?.created_at}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
