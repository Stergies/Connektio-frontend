import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5002/api",
});

// Προσθέτει αυτόματα το JWT token σε κάθε αίτημα, αν υπάρχει
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem("phonebook_user");
  if (stored) {
    const { token } = JSON.parse(stored);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Αν το token έχει λήξει/είναι άκυρο, αποσυνδέει τον χρήστη
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("phonebook_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
