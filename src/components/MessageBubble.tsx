"use client";

import { useState } from "react";
import {
  User,
  Bot,
  Copy,
  Edit,
  Trash2,
  RotateCcw,
  Check,
  X,
  AlertCircle,
  Info,
} from "lucide-react";
import { Message } from "../types";

interface MessageBubbleProps {
  message: Message;
  isLast: boolean;
  onRetry: (messageId: string) => void;
  onEdit: (messageId: string, newContent: string) => void;
  onDelete: (messageId: string) => void;
}

export default function MessageBubble({
  message,
  isLast,
  onRetry,
  onEdit,
  onDelete,
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleSaveEdit = () => {
    if (editContent.trim() !== message.content) {
      onEdit(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getMessageIcon = () => {
    switch (message.role) {
      case "user":
        return <User className="h-6 w-6 text-blue-600" />;
      case "assistant":
        return <Bot className="h-6 w-6 text-green-600" />;
      case "system":
        return <Info className="h-6 w-6 text-orange-600" />;
      default:
        return <AlertCircle className="h-6 w-6 text-gray-600" />;
    }
  };

  const getMessageStyle = () => {
    switch (message.role) {
      case "user":
        return "bg-blue-600 text-white ml-12";
      case "assistant":
        return "bg-white text-gray-900 border border-gray-200 mr-12";
      case "system":
        return "bg-orange-50 text-orange-800 border border-orange-200 mx-8";
      default:
        return "bg-gray-100 text-gray-900 mx-8";
    }
  };

  const isAssistant = message.role === "assistant";
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  return (
    <div
      className={`flex items-start space-x-3 ${
        isUser ? "flex-row-reverse space-x-reverse" : ""
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? "bg-blue-100"
            : isAssistant
            ? "bg-green-100"
            : "bg-orange-100"
        }`}
      >
        {getMessageIcon()}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-3xl ${isUser ? "flex justify-end" : ""}`}>
        <div className={`rounded-lg px-4 py-3 shadow-sm ${getMessageStyle()}`}>
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                autoFocus
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                >
                  <Check className="h-3 w-3" />
                  <span>Save</span>
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center space-x-1 px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              </div>

              {/* Timestamp */}
              <div
                className={`text-xs opacity-70 ${
                  isUser ? "text-right" : "text-left"
                }`}
              >
                {formatTime(message.timestamp)}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!isEditing && !isSystem && (
          <div
            className={`flex items-center space-x-1 mt-2 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity ${
              isUser ? "justify-end" : "justify-start"
            }`}
          >
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Copy message"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 text-gray-500" />
              )}
            </button>

            {isUser && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Edit message"
              >
                <Edit className="h-4 w-4 text-gray-500" />
              </button>
            )}

            {isAssistant && (
              <button
                onClick={() => onRetry(message.id)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Retry message"
              >
                <RotateCcw className="h-4 w-4 text-gray-500" />
              </button>
            )}

            <button
              onClick={() => onDelete(message.id)}
              className="p-1 hover:bg-red-100 rounded transition-colors"
              title="Delete message"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
