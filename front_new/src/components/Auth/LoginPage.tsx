import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Token, UserLogin } from '../../types';
import apiClient from '../../lib/api'; // Импортируем наш apiClient

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      // Используем apiClient.post вместо fetch
      const response = await apiClient.post<Token>('/auth/token', new URLSearchParams({
        username,
        password,
      }).toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      // apiClient уже обрабатывает response.ok и 401 ошибки через интерцепторы,
      // поэтому мы можем напрямую работать с response.data
      const data: Token = response.data; // response.data уже содержит наш токен

      localStorage.setItem('access_token', data.access_token);
      navigate('/'); // Перенаправляем на главную страницу после успешного входа
    } catch (err: any) { // Добавляем any для err, чтобы TypeScript не ругался на проверку instanceof Error
      // Интерцептор apiClient уже должен был перехватить 401,
      // но на случай других ошибок или если интерцептор не сработал
      setError(err.response?.data?.detail || err.message || 'Неизвестная ошибка');
      console.error('Login error:', err);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Вход</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <div className="mb-4">
          <label htmlFor="username" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Имя пользователя:</label>
          <input
            type="text"
            id="username"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-white dark:border-gray-600"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label htmlFor="password" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Пароль:</label>
          <input
            type="password"
            id="password"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-white dark:border-gray-600"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          >
            Войти
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginPage; 