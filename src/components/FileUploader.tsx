"use client";

import { useState, useRef } from "react";
import { Upload, FileText, AlertCircle, CheckCircle, X } from "lucide-react";
import { uploadFile } from "@/lib/apiRoutes";

interface FileUploaderProps {
  onFileUpload: (file: any) => void;
}

export default function FileUploader({ onFileUpload }: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  const handleFileChange = (file: File) => {
    if (!supportedTypes.includes(file.type)) {
      setErrorMessage(
        "File type not supported. Please upload PDF, DOC, DOCX, TXT, CSV, or Excel files."
      );
      setUploadStatus("error");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      setErrorMessage("File size must be less than 10MB.");
      setUploadStatus("error");
      return;
    }

    setSelectedFile(file);
    setUploadStatus("idle");
    setErrorMessage("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFileChange(e.target.files[0]);
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

    if (e.dataTransfer.files?.[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadStatus("idle");
    setErrorMessage("");

    try {
      const result = await uploadFile(selectedFile);

      const fileObj = {
        id: Date.now().toString(),
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        uploadDate: new Date().toISOString(),
        ...result,
      };

      onFileUpload(fileObj);
      setUploadStatus("success");
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Upload failed. Please try again.");
      setUploadStatus("error");
    } finally {
      setIsUploading(false);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setUploadStatus("idle");
    setErrorMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? "border-blue-400 bg-blue-50"
            : selectedFile
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
          accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
        />

        {!selectedFile ? (
          <div className="space-y-2">
            <Upload className="h-8 w-8 text-gray-400 mx-auto" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Drop your file here, or{" "}
                <span className="text-blue-600 hover:text-blue-500 cursor-pointer">
                  browse
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supports PDF, DOC, DOCX, TXT, CSV, Excel (max 10MB)
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <FileText className="h-8 w-8 text-green-500 mx-auto" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <button
              onClick={removeSelectedFile}
              className="absolute top-2 right-2 p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        )}
      </div>

      {/* Upload Button */}
      {selectedFile && (
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
            isUploading
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isUploading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Uploading...</span>
            </div>
          ) : (
            "Upload File"
          )}
        </button>
      )}

      {/* Status Messages */}
      {uploadStatus === "success" && (
        <div className="flex items-center space-x-2 p-3 bg-green-50 text-green-700 rounded-lg">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">File uploaded successfully!</span>
        </div>
      )}

      {uploadStatus === "error" && errorMessage && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{errorMessage}</span>
        </div>
      )}

      {/* File Type Info */}
      <div className="text-xs text-gray-500 space-y-1">
        <p className="font-medium">Supported file types:</p>
        <p>• PDF documents</p>
        <p>• Microsoft Word (DOC, DOCX)</p>
        <p>• Plain text files (TXT)</p>
        <p>• CSV and Excel files (XLS, XLSX)</p>
      </div>
    </div>
  );
}
