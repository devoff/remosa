import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

interface JournalPanelProps {
  logs: any[];
  platformId?: number;
}

const JournalPanel: React.FC<JournalPanelProps> = ({ logs }) => (
  <TableContainer>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Время</TableCell>
          <TableCell>Действие</TableCell>
          <TableCell>Пользователь</TableCell>
          <TableCell>Детали</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
            <TableCell>{log.action}</TableCell>
            <TableCell>{log.user_email || log.user_id}</TableCell>
            <TableCell>{log.details}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

export default JournalPanel; 