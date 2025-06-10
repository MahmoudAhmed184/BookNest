// /api/books/reading-lists/
import axios from "axios";

const url = "http://localhost:8000";

const getCollections = async () => {
  const token = localStorage.getItem("token");
  console.log(token);
  try {
    const response = await axios.get(`${url}/api/books/reading-lists/`, {
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

const createCollection = async (data) => {
  const token = localStorage.getItem("token");
  console.log(token);
  console.log(data);

  try {
    const response = await axios.post(
      `${url}/api/books/reading-lists/create/`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.log(error.response.data);
    return error.response.data;
  }
};

const addToCollection = async (data) => {
  console.log(data);

  const token = localStorage.getItem("token");
  try {
    const response = await axios.post(
      `${url}/api/books/reading-lists/books/`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);

    return error.response.data;
  }
};

const getUserCollections = async (id) => {
  const token = localStorage.getItem("token");
  console.log(token);
  try {
    const response = await axios.get(
      `${url}/api/books/users/${id}/reading-lists/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.log(error.response.data);
    return error.response.data;
  }
};

export {
  getCollections,
  createCollection,
  addToCollection,
  getUserCollections,
};
