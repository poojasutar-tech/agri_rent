import axios from "axios";

export const get_domain = () => {
  return "http://127.0.0.1:8000";
};

const domain = get_domain();

const api = axios.create({
  baseURL: domain,
  withCredentials: true,
});

export default api;