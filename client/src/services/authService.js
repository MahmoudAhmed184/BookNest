import axios from "axios";

const url = "http://localhost:8000";

const createProfile = async () => {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.post(
      `${url}/api/users/profile/`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

const getMyProfile = async () => {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.get(`${url}/api/users/profile/me/`, {
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

const login = async (formData) => {
  try {
    const response = await axios.post(`${url}/api/users/login/`, formData);
    return response.data.data;
  } catch (error) {
    return error.response.data;
  }
};

const register = async (formData) => {
  console.log(formData);
  try {
    const response = await axios.post(`${url}/api/users/register/`, formData);
    return response.data.data;
  } catch (error) {
    return error.response.data;
  }
};

export { login, register, createProfile };
