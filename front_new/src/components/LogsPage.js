import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, Tabs } from 'antd';
import { CommandLogsPageContent } from './CommandLogsPageContent'; // Предполагаем, что вы вынесли контент в этот файл
import { AuditLogsPage } from './AuditLogsPage'; // Импортируем страницу аудита
const { TabPane } = Tabs;
export const LogsPage = () => {
    return (_jsx("div", { className: "p-4", children: _jsx(Card, { className: "dark:bg-gray-800 rounded-lg", children: _jsxs(Tabs, { defaultActiveKey: "1", children: [_jsx(TabPane, { tab: "\u041B\u043E\u0433\u0438 \u043A\u043E\u043C\u0430\u043D\u0434", children: _jsx(CommandLogsPageContent, {}) }, "1"), _jsx(TabPane, { tab: "\u041B\u043E\u0433\u0438 \u0430\u0443\u0434\u0438\u0442\u0430", children: _jsx(AuditLogsPage, {}) }, "2")] }) }) }));
};
