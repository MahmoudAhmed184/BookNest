import React from "react";
import UserImage from "/user_profile.png";
import Logo from "/logo.svg";

import { getNotifications } from "../services/notificationService";
import { useQuery } from "@tanstack/react-query";

export default function Notifications() {
  // const notifications = [
  //   {
  //     userImage: UserImage,
  //     actionText: "@Mosab started following you.",
  //   },
  //   {
  //     userImage: UserImage,
  //     actionText:
  //       "@Mosab started reading Harry Potter: The Prisoner of Azkaban.",
  //   },
  //   {
  //     userImage: UserImage,
  //     actionText: "@Jane added The Great Gatsby to their library.",
  //   },
  // ];

  const {
    data: notifications,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications(localStorage.getItem("token")),
  });

  if (isLoading)
    return (
      <div className="flex-grow flex justify-center items-center">
        <div className="spinner"></div>
      </div>
    );
  if (error) return <p>Error fetching notifications</p>;

  console.log(notifications);

  return (
    <div className="flex flex-col gap-md py-md">
      <h2 className="text-lg sm:text-xl md:text-2xl text-accent-v bg-clip-text text-transparent font-semibold text-center">
        Notifications ({notifications?.length})
      </h2>
      <div className="flex flex-col gap-2 sm:gap-3">
        {notifications?.length > 0 ? (
          notifications
            ?.filter((notification) => notification.read === false)
            .map((notification, index) => (
              <div
                key={index}
                className="flex items-center gap-3 sm:gap-4 py-2 sm:py-3 px-4 sm:px-6 bg-secondary-black text-secondary-gray w-full rounded-xl"
              >
                {/* User Image */}
                <div className="w-8 sm:w-8 h-8 sm:h-8 rounded-xl overflow-hidden flex-shrink-0">
                  <img
                    src={Logo}
                    alt="User avatar"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Action Text */}
                <div className="flex flex-col justify-between">
                  <p className="mt-2 text-sm text-primary-white">
                    <strong className="text-accent">
                      System Notification:
                    </strong>{" "}
                    <br></br> {notification?.verb}
                  </p>
                  <div className="flex justify-between items-end">
                    <p className="text-primary-gray text-xs mt-2">
                      {notification?.timestamp}
                    </p>
                    {/* <p className="text-primary-gray text-xs mt-2">
                      Mark as read
                    </p> */}
                  </div>
                </div>
              </div>
            ))
        ) : (
          <p className="text-sm sm:text-base md:text-lg text-primary-gray text-center">
            No notifications yet. Start exploring to connect with others!
          </p>
        )}
      </div>
    </div>
  );
}
