import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        try {
            const response = await fetch('/api/v1/auth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    username,
                    password,
                }).toString(),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Ошибка входа');
            }
            const data = await response.json();
            localStorage.setItem('access_token', data.access_token);
            navigate('/'); // Перенаправляем на главную страницу после успешного входа
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
            console.error('Login error:', err);
        }
    };
    return (_jsx("div", { className: "flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900", children: _jsxs("form", { onSubmit: handleSubmit, className: "bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-96", children: [_jsx("h2", { className: "text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white", children: "\u0412\u0445\u043E\u0434" }), error && _jsx("p", { className: "text-red-500 text-center mb-4", children: error }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { htmlFor: "username", className: "block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2", children: "\u0418\u043C\u044F \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F:" }), _jsx("input", { type: "text", id: "username", className: "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-white dark:border-gray-600", value: username, onChange: (e) => setUsername(e.target.value), required: true })] }), _jsxs("div", { className: "mb-6", children: [_jsx("label", { htmlFor: "password", className: "block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2", children: "\u041F\u0430\u0440\u043E\u043B\u044C:" }), _jsx("input", { type: "password", id: "password", className: "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-white dark:border-gray-600", value: password, onChange: (e) => setPassword(e.target.value), required: true })] }), _jsx("div", { className: "flex items-center justify-between", children: _jsx("button", { type: "submit", className: "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full", children: "\u0412\u043E\u0439\u0442\u0438" }) })] }) }));
};
export default LoginPage;
