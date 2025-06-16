// hooks/useChatState.ts
import { useEffect, useState } from "react";
import { Message } from "@/types";

export function useChatState() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem("chatMessages");
      const savedFiles = localStorage.getItem("uploadedFiles");

      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        const parsedWithDates = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(parsedWithDates);
      }

      if (savedFiles) {
        setUploadedFiles(JSON.parse(savedFiles));
      }
    } catch (err) {
      console.error("Failed to load state:", err);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("uploadedFiles", JSON.stringify(uploadedFiles));
  }, [uploadedFiles]);

  return {
    messages,
    setMessages,
    uploadedFiles,
    setUploadedFiles,
  };
}
