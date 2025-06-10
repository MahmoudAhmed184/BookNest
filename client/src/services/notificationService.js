// /api/notifications/

import axios from "axios";

const url = "http://localhost:8000";

const getNotifications = async (token) => {
  console.log(token);

  try {
    const response = await axios.get(`${url}/api/notifications/`, {
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

export { getNotifications };
