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
