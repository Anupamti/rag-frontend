"use client";

import { Menu, FileText, Bot } from "lucide-react";

interface HeaderProps {
  onToggleSidebar: () => void;
  fileCount: number;
}

export default function Header({ onToggleSidebar, fileCount }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </button>

        <div className="flex items-center space-x-2">
          <Bot className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-900">CaseBase</h1>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {fileCount > 0 && (
          <div className="flex items-center space-x-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
            <FileText className="h-4 w-4" />
            <span>
              {fileCount} file{fileCount !== 1 ? "s" : ""} uploaded
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
