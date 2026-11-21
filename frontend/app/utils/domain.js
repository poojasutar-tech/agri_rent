import axios from "axios";

export const get_domain = () => {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL;
  return configuredUrl
    ? configuredUrl.replace(/\/+$/, "")
    : "http://127.0.0.1:8000";
};

const domain = get_domain();

const api = axios.create({
  baseURL: domain,
  withCredentials: true,
});

let refreshRequest = null;

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.set
          ? config.headers.set("Authorization", `Bearer ${token}`)
          : (config.headers.Authorization = `Bearer ${token}`);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    const requestUrl = request?.url || "";

    if (
      typeof window === "undefined" ||
      error.response?.status !== 401 ||
      !request ||
      request._retry ||
      requestUrl.includes("/api/token/refresh/") ||
      requestUrl.includes("/api/auth/login/")
    ) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return Promise.reject(error);

    request._retry = true;

    try {
      if (!refreshRequest) {
        refreshRequest = axios
          .post(`${domain}/api/token/refresh/`, { refresh: refreshToken }, { withCredentials: true })
          .then(({ data }) => {
            if (!data?.access) {
              throw new Error("Token refresh response did not include an access token.");
            }
            localStorage.setItem("token", data.access);
            if (data.refresh) {
              localStorage.setItem("refresh_token", data.refresh);
            }
            return data.access;
          })
          .finally(() => {
            refreshRequest = null;
          });
      }

      const accessToken = await refreshRequest;
      request.headers = request.headers || {};
      if (request.headers.set) {
        request.headers.set("Authorization", `Bearer ${accessToken}`);
      } else {
        request.headers.Authorization = `Bearer ${accessToken}`;
      }
      return api(request);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

export default api;