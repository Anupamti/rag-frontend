"use client";

import { useState } from "react";
import {
  X,
  Upload,
  FileText,
  Trash2,
  MessageSquare,
  RefreshCw,
  File,
  Image,
  FileSpreadsheet,
} from "lucide-react";
import FileUploader from "./FileUploader";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  uploadedFiles: any[];
  onFileUpload: (file: any) => void;
  onDeleteFile: (fileId: string) => void;
  onClearChat: () => void;
  onClearFiles: () => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  uploadedFiles,
  onFileUpload,
  onDeleteFile,
  onClearChat,
  onClearFiles,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "files">("upload");

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return <FileText className="h-4 w-4 text-red-500" />;
      case "doc":
      case "docx":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "xls":
      case "xlsx":
        return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <Image className="h-4 w-4 text-purple-500" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("upload")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "upload"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Upload className="h-4 w-4 inline mr-2" />
              Upload
            </button>
            <button
              onClick={() => setActiveTab("files")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "files"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Files ({uploadedFiles.length})
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "upload" && (
              <FileUploader onFileUpload={onFileUpload} />
            )}

            {activeTab === "files" && (
              <div className="space-y-3">
                {uploadedFiles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No files uploaded yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Upload documents to start chatting about them
                    </p>
                  </div>
                ) : (
                  uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2 flex-1 min-w-0">
                          {getFileIcon(file.name)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)}
                            </p>
                            {file.uploadDate && (
                              <p className="text-xs text-gray-400">
                                {new Date(file.uploadDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => onDeleteFile(file.id)}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                          title="Delete file"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 p-4 space-y-2">
            <button
              onClick={onClearChat}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Clear Chat</span>
            </button>

            {uploadedFiles.length > 0 && (
              <button
                onClick={onClearFiles}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Clear All Files</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
