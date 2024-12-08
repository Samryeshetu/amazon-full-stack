import axios from "axios";

const axiosInstance = axios.create({
  // baseURL: "http://localhost:4000",
  baseURL:"https://amazon-backend-dowe.onrender.com/",
});

export { axiosInstance };
