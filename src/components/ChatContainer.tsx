"use client";

import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { Message } from "../types";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import EmptyState from "./EmptyState";
import { askQuestion } from "@/lib/apiRoutes";

interface ChatContainerProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  isProcessing: boolean;
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
  uploadedFiles: any[];
}

type QueryType = "policy_check" | "recommendation" | "cross_reference" | "";

export default function ChatContainer({
  messages,
  setMessages,
  inputValue,
  setInputValue,
  isProcessing,
  setIsProcessing,
  uploadedFiles,
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [queryType, setQueryType] = useState<QueryType>("");

  const queryTypeOptions = [
    { value: "policy_check", label: "Policy Check" },
    { value: "recommendation", label: "Recommendation" },
    { value: "cross_reference", label: "Cross Reference" },
    { value: "", label: "General" },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsProcessing(true);

    try {
      const data = await askQuestion(inputValue, queryType);

      const assistantMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: data.reply || data.answer || JSON.stringify(data),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Error communicating with AI service:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "assistant",
          content:
            error.message ||
            "I'm sorry, I encountered an error processing your request. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTranscribedText = (text: string) => {
    setInputValue((prev) => prev + (prev ? " " : "") + text);
  };

  const handleRetry = (messageId: string) => {
    const messageIndex = messages.findIndex((msg) => msg.id === messageId);
    if (messageIndex > 0) {
      const userMessage = messages[messageIndex - 1];
      if (userMessage.role === "user") {
        setInputValue(userMessage.content);
        setMessages((prev) => prev.slice(0, messageIndex));
      }
    }
  };

  const handleEdit = (messageId: string, newContent: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, content: newContent } : msg
      )
    );
  };

  const handleDelete = (messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState uploadedFiles={uploadedFiles} />
        ) : (
          <MessageList
            messages={messages}
            onRetry={handleRetry}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Query Type Selector */}
      <div className="px-4 py-2 border-t bg-gray-50">
        <div className="flex items-center gap-2">
          <label
            htmlFor="queryType"
            className="text-sm font-medium text-gray-700"
          >
            Query Type:
          </label>
          <select
            id="queryType"
            value={queryType}
            onChange={(e) => setQueryType(e.target.value as QueryType)}
            className="px-3 py-1 text-sm border  border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          >
            {queryTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ChatInput
        inputValue={inputValue}
        setInputValue={setInputValue}
        onSendMessage={handleSendMessage}
        onTranscribedText={handleTranscribedText}
        isProcessing={isProcessing}
        hasFiles={uploadedFiles.length > 0}
      />
    </div>
  );
}
