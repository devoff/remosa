import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/useAuth';
const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();
    // Проверяем, авторизован ли пользователь при загрузке страницы
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/users'); // Перенаправляем на страницу пользователей, если уже авторизован
        }
    }, [isAuthenticated, navigate]);
    const handleSubmit = async (event) => {
        event.preventDefault();
        // Не сбрасываем ошибку сразу, только при изменении полей
        setIsLoading(true);
        try {
            await login(username, password);
            // После успешного входа useAuth автоматически перенаправит пользователя
        }
        catch (err) {
            // Обрабатываем различные типы ошибок
            let errorMessage = 'Неизвестная ошибка';
            if (err.response?.data?.detail) {
                errorMessage = err.response.data.detail;
            }
            else if (err.response?.status === 401) {
                errorMessage = 'Неправильное имя пользователя или пароль';
            }
            else if (err.response?.status === 422) {
                errorMessage = 'Неверный формат данных. Проверьте введенные данные.';
            }
            else if (err.response?.status >= 500) {
                errorMessage = 'Ошибка сервера. Попробуйте позже.';
            }
            else if (err.code === 'NETWORK_ERROR' || !err.response) {
                errorMessage = 'Ошибка сети. Проверьте подключение к интернету.';
            }
            else if (err.message) {
                errorMessage = err.message;
            }
            setError(errorMessage);
            console.error('Login error:', err);
        }
        finally {
            setIsLoading(false);
        }
    };
    // Сброс ошибки только при изменении полей
    const handleUsernameChange = (e) => {
        setUsername(e.target.value);
        if (error)
            setError(null);
    };
    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
        if (error)
            setError(null);
    };
    return (_jsx("div", { className: "flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900", children: _jsxs("form", { onSubmit: handleSubmit, className: "bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-96", children: [_jsx("h2", { className: "text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white", children: "\u0412\u0445\u043E\u0434" }), error && _jsx("p", { className: "text-red-500 text-center mb-4", children: error }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { htmlFor: "username", className: "block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2", children: "Email:" }), _jsx("input", { type: "email", id: "username", className: "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-white dark:border-gray-600", value: username, onChange: handleUsernameChange, disabled: isLoading, required: true })] }), _jsxs("div", { className: "mb-6", children: [_jsx("label", { htmlFor: "password", className: "block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2", children: "\u041F\u0430\u0440\u043E\u043B\u044C:" }), _jsx("input", { type: "password", id: "password", className: "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-white dark:border-gray-600", value: password, onChange: handlePasswordChange, disabled: isLoading, required: true })] }), _jsx("div", { className: "flex items-center justify-between", children: _jsx("button", { type: "submit", disabled: isLoading, className: `font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition-colors ${isLoading
                            ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                            : 'bg-blue-500 hover:bg-blue-700 text-white'}`, children: isLoading ? 'Вход...' : 'Войти' }) })] }) }));
};
export default LoginPage;
