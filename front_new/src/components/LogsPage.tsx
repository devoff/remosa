import React from 'react';
import { Card, Tabs } from 'antd';
import { CommandLogsPageContent } from './CommandLogsPageContent'; // Предполагаем, что вы вынесли контент в этот файл
import { AuditLogsPage } from './AuditLogsPage'; // Импортируем страницу аудита

const { TabPane } = Tabs;

export const LogsPage: React.FC = () => {
    return (
        <div className="p-4">
            <Card className="dark:bg-gray-800 rounded-lg">
                <Tabs defaultActiveKey="1">
                    <TabPane tab="Логи команд" key="1">
                        <CommandLogsPageContent />
                    </TabPane>
                    <TabPane tab="Логи аудита" key="2">
                        <AuditLogsPage />
                    </TabPane>
                </Tabs>
            </Card>
        </div>
    );
}; 