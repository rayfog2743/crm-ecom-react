// // src/lib/axios.ts
// import axios, { AxiosError, AxiosInstance } from "axios";

// // const BASE_URL_2 ="https://9nutsapi.nearbydoctors.in/public/api";
// // const BASE_URL_2 ="https://api-rayfog.nearbydoctors.in/public/api";
// const BASE_URL_2 ="http://localhost:8000/api";

// const api: AxiosInstance = axios.create({
//   baseURL: BASE_URL_2,
//   timeout: 30_000,
//   headers: {
//     "Content-Type": "application/json",
//     Accept: "application/json",
//   },
// });
// api.interceptors.request.use(
//   (config) => {
//     if (typeof window !== "undefined") {
//       const token = localStorage.getItem("token"); 
//       if (token && config.headers) {
//         config.headers.Authorization = `Bearer ${token}`;
//       }
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );
// api.interceptors.response.use(
//   (resp) => resp,
//   (error: AxiosError) => {
//     if (error.response?.status === 401) {
//       try {
//         localStorage.removeItem("token"); 
//         localStorage.removeItem("token"); 
//       } catch {}
//     }
//     return Promise.reject(error);
//   }
// );

// export default api;

// src/lib/axios.ts
import axios, { AxiosError, AxiosInstance } from "axios";

const BASE_URL_2 = "http://localhost:8000/api";

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL_2,
  timeout: 30_000,
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (resp) => resp,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem("token");
      } catch {}
    }
    return Promise.reject(error);
  }
);

export default api;
