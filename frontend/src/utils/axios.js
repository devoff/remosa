import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://192.168.1.122',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Обработка ошибок
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default axiosInstance; 