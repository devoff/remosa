import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/useAuth';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Проверяем, авторизован ли пользователь при загрузке страницы
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/users'); // Перенаправляем на страницу пользователей, если уже авторизован
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    // Не сбрасываем ошибку сразу, только при изменении полей
    setIsLoading(true);

    try {
      await login(username, password);
      // После успешного входа useAuth автоматически перенаправит пользователя
    } catch (err: any) {
      // Обрабатываем различные типы ошибок
      let errorMessage = 'Неизвестная ошибка';
      
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.status === 401) {
        errorMessage = 'Неправильное имя пользователя или пароль';
      } else if (err.response?.status === 422) {
        errorMessage = 'Неверный формат данных. Проверьте введенные данные.';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Ошибка сервера. Попробуйте позже.';
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        errorMessage = 'Ошибка сети. Проверьте подключение к интернету.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Сброс ошибки только при изменении полей
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    if (error) setError(null);
  };
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError(null);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Вход</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <div className="mb-4">
          <label htmlFor="username" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Email:</label>
          <input
            type="email"
            id="username"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-white dark:border-gray-600"
            value={username}
            onChange={handleUsernameChange}
            disabled={isLoading}
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
            onChange={handlePasswordChange}
            disabled={isLoading}
            required
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={isLoading}
            className={`font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition-colors ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed text-gray-600' 
                : 'bg-blue-500 hover:bg-blue-700 text-white'
            }`}
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginPage; 