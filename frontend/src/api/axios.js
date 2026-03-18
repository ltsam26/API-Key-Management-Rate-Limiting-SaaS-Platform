import axios from "axios";

const API = axios.create({
  baseURL: "https://api-platform-36kg.onrender.com/api",
});

export default API;