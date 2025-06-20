"use client";

import { useState, useRef } from "react";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  Loader2,
} from "lucide-react";
import { uploadFile } from "@/lib/apiRoutes";

interface FileUploaderProps {
  onFileUpload: (file: any) => void;
}

interface FileUploadState {
  file: File;
  id: string;
  status: "pending" | "uploading" | "success" | "error";
  errorMessage?: string;
  progress?: number;
}

export default function FileUploader({ onFileUpload }: FileUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileUploadState[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  const validateFile = (file: File): string | null => {
    if (!supportedTypes.includes(file.type)) {
      return "File type not supported. Please upload PDF, DOC, DOCX";
    }

    if (file.size > 10 * 1024 * 1024) {
      return "File size must be less than 10MB.";
    }

    return null;
  };

  const addFiles = (files: FileList) => {
    const newFiles: FileUploadState[] = [];

    Array.from(files).forEach((file) => {
      const errorMessage = validateFile(file);
      const fileState: FileUploadState = {
        file,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: errorMessage ? "error" : "pending",
        errorMessage: errorMessage || undefined,
      };
      newFiles.push(fileState);
    });

    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const uploadSingleFile = async (fileState: FileUploadState) => {
    if (fileState.status !== "pending") return;

    // Update status to uploading
    setSelectedFiles((prev) =>
      prev.map((f) =>
        f.id === fileState.id ? { ...f, status: "uploading" as const } : f
      )
    );

    try {
      const result = await uploadFile(fileState.file);

      const fileObj = {
        id: fileState.id,
        name: fileState.file.name,
        size: fileState.file.size,
        type: fileState.file.type,
        uploadDate: new Date().toISOString(),
        ...result,
      };

      onFileUpload(fileObj);

      // Update status to success
      setSelectedFiles((prev) =>
        prev.map((f) =>
          f.id === fileState.id ? { ...f, status: "success" as const } : f
        )
      );
    } catch (err: any) {
      console.error(err);
      // Update status to error
      setSelectedFiles((prev) =>
        prev.map((f) =>
          f.id === fileState.id
            ? {
                ...f,
                status: "error" as const,
                errorMessage: err.message || "Upload failed. Please try again.",
              }
            : f
        )
      );
    }
  };

  const uploadAllFiles = async () => {
    const pendingFiles = selectedFiles.filter((f) => f.status === "pending");

    // Upload all files simultaneously
    const uploadPromises = pendingFiles.map((fileState) =>
      uploadSingleFile(fileState)
    );
    await Promise.allSettled(uploadPromises);
  };

  const removeFile = (fileId: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const retryUpload = (fileId: string) => {
    setSelectedFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? { ...f, status: "pending" as const, errorMessage: undefined }
          : f
      )
    );

    const fileToRetry = selectedFiles.find((f) => f.id === fileId);
    if (fileToRetry) {
      uploadSingleFile(fileToRetry);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusIcon = (status: FileUploadState["status"]) => {
    switch (status) {
      case "pending":
        return <FileText className="h-4 w-4 text-gray-500" />;
      case "uploading":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: FileUploadState["status"]) => {
    switch (status) {
      case "pending":
        return "border-gray-200 bg-gray-50";
      case "uploading":
        return "border-blue-200 bg-blue-50";
      case "success":
        return "border-green-200 bg-green-50";
      case "error":
        return "border-red-200 bg-red-50";
    }
  };

  const pendingCount = selectedFiles.filter(
    (f) => f.status === "pending"
  ).length;
  const uploadingCount = selectedFiles.filter(
    (f) => f.status === "uploading"
  ).length;
  const successCount = selectedFiles.filter(
    (f) => f.status === "success"
  ).length;
  const errorCount = selectedFiles.filter((f) => f.status === "error").length;

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? "border-blue-400 bg-blue-50"
            : selectedFiles.length > 0
            ? "border-green-300 bg-green-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept=".pdf,.doc,.docx,.txt"
          multiple
        />

        <div className="space-y-2">
          <Upload className="h-8 w-8 text-gray-400 mx-auto" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              Drop your files here, or{" "}
              <span className="text-blue-600 hover:text-blue-500 cursor-pointer">
                browse
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supports PDF, DOC, DOCX, TXT (max 10MB each)
            </p>
            {selectedFiles.length > 0 && (
              <p className="text-xs text-blue-600 mt-1">
                {selectedFiles.length} file
                {selectedFiles.length !== 1 ? "s" : ""} selected
              </p>
            )}
          </div>
        </div>
      </div>

      {/* File List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">
              Selected Files
            </h3>
            <button
              onClick={clearAllFiles}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {selectedFiles.map((fileState) => (
              <div
                key={fileState.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(
                  fileState.status
                )}`}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getStatusIcon(fileState.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {fileState.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(fileState.file.size)}
                    </p>
                    {fileState.errorMessage && (
                      <p className="text-xs text-red-600 mt-1">
                        {fileState.errorMessage}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {fileState.status === "error" && (
                    <button
                      onClick={() => retryUpload(fileState.id)}
                      className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Retry
                    </button>
                  )}
                  <button
                    onClick={() => removeFile(fileState.id)}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                    disabled={fileState.status === "uploading"}
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Actions */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          {/* Upload Button */}
          {pendingCount > 0 && (
            <button
              onClick={uploadAllFiles}
              disabled={uploadingCount > 0}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                uploadingCount > 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {uploadingCount > 0 ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    Uploading {uploadingCount} file
                    {uploadingCount !== 1 ? "s" : ""}...
                  </span>
                </div>
              ) : (
                `Upload ${pendingCount} file${pendingCount !== 1 ? "s" : ""}`
              )}
            </button>
          )}

          {/* Status Summary */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {successCount > 0 && (
              <div className="flex items-center space-x-1 text-green-600">
                <CheckCircle className="h-3 w-3" />
                <span>{successCount} uploaded</span>
              </div>
            )}
            {errorCount > 0 && (
              <div className="flex items-center space-x-1 text-red-600">
                <AlertCircle className="h-3 w-3" />
                <span>{errorCount} failed</span>
              </div>
            )}
            {uploadingCount > 0 && (
              <div className="flex items-center space-x-1 text-blue-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>{uploadingCount} uploading</span>
              </div>
            )}
            {pendingCount > 0 && (
              <div className="flex items-center space-x-1 text-gray-600">
                <FileText className="h-3 w-3" />
                <span>{pendingCount} pending</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* File Type Info */}
      <div className="text-xs text-gray-500 space-y-1">
        <p className="font-medium">Supported file types:</p>
        <p>• PDF documents</p>
        <p>• Microsoft Word (DOC, DOCX)</p>
        <p>• Plain text files (TXT)</p>
      </div>
    </div>
  );
}
