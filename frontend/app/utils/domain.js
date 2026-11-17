import axios from "axios";

export const get_domain = () => {
  return "http://127.0.0.1:8000";
};

const domain = get_domain();

const api = axios.create({
  baseURL: domain,
  withCredentials: true,
});

// ✨ Added: Request interceptor to automatically attach the JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;