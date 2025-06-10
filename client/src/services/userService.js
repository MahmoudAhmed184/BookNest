import axios from "axios";

const url = "http://localhost:8000";

// const createMyProfile = async () => {
//   try {
//     const response = await axios.post(`${url}/api/users/profile/me/`, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });
//     console.log(response.data);
//     return response.data;
//   } catch (error) {
//     console.log(error.response.data);
//     return error.response.data;
//   }
// };

const getMyProfile = async () => {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.get(`${url}/api/users/profile/me/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(response.data.data.profile);

    return response.data.data.profile;
  } catch (error) {
    return error.response.data;
  }
};

const getProfile = async (id) => {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.get(`${url}/api/users/profile/${id}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(response.data.data.profile);

    return response.data.data.profile;
  } catch (error) {
    return error.response.data;
  }
};

const getUserProfile = async (id) => {
  const token = localStorage.getItem("token");
  console.log(token);
  // eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzQ4OTc2MTQzLCJpYXQiOjE3NDg5NzI1NDMsImp0aSI6ImVmMDZmMjZhYmM5ZjQ1YjNhMDM5MTc1YmM3ZWM2YTc0IiwidXNlcl9pZCI6OX0.xXOzo53usXgXvQKQ
  try {
    const response = await axios.get(`${url}/api/users/profile/${id}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.log(error.response.data);
    return error.response.data;
  }
};

// const updateProfile = async (token, data) => {
//   console.log(token);
//   try {
//     const response = await axios.put(`${url}/api/users/profile/me/`, data, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });
//     console.log(response.data);
//     return response.data;
//   } catch (error) {
//     console.log(error.response.data);
//     return error.response.data;
//   }
// };

const updateUser = async (token, data) => {
  console.log(token);
  try {
    const response = await axios.patch(`${url}/api/users/user/`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(response.data);
    // updateProfile(token, data);
    return response.data;
  } catch (error) {
    console.log(error.response.data);
    return error.response.data;
  }
};

const updateBio = async (data) => {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.patch(`${url}/api/users/profile/me/`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.log(error.response.data);
    return error.response.data;
  }
};

const getUserReviews = async (id) => {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.get(`${url}/api/books/users/${id}/reviews/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

const getUserRatings = async (id) => {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.get(`${url}/api/books/users/${id}/ratings/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

const deleteReview = async (id) => {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.delete(
      `${url}/api/books/reviews/${id}/delete/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error response:", error.response?.data || error.message);
    throw error;
  }
};

export {
  getMyProfile,
  getUserProfile,
  updateUser,
  updateBio,
  getProfile,
  getUserReviews,
  getUserRatings,
  deleteReview,
};
