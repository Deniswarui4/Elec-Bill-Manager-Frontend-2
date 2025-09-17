import React from 'react';
import { cn } from '../../lib/utils';

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

const Table: React.FC<TableProps> = ({ className, children, ...props }) => {
  return (
    <div className="overflow-x-auto">
      <table
        className={cn(
          'min-w-full divide-y divide-gray-200',
          className
        )}
        {...props}
      >
        {children}
      </table>
    </div>
  );
};

interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

const TableHeader: React.FC<TableHeaderProps> = ({ className, children, ...props }) => {
  return (
    <thead
      className={cn('bg-gray-50', className)}
      {...props}
    >
      {children}
    </thead>
  );
};

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

const TableBody: React.FC<TableBodyProps> = ({ className, children, ...props }) => {
  return (
    <tbody
      className={cn('bg-white divide-y divide-gray-200', className)}
      {...props}
    >
      {children}
    </tbody>
  );
};

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
}

const TableRow: React.FC<TableRowProps> = ({ className, children, ...props }) => {
  return (
    <tr
      className={cn('hover:bg-gray-50', className)}
      {...props}
    >
      {children}
    </tr>
  );
};

interface TableHeadProps extends React.HTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
}

const TableHead: React.FC<TableHeadProps> = ({ className, children, ...props }) => {
  return (
    <th
      className={cn(
        'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
};

interface TableCellProps extends React.HTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
}

const TableCell: React.FC<TableCellProps> = ({ className, children, ...props }) => {
  return (
    <td
      className={cn('px-6 py-4 whitespace-nowrap text-sm text-gray-900', className)}
      {...props}
    >
      {children}
    </td>
  );
};

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };