"use client";

import { useState } from "react";
import Head from "next/head";
import { Message } from "../types";
import ChatContainer from "@/components/ChatContainer";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { resetServerState } from "@/lib/apiRoutes";
import { useChatState } from "@/hooks/useChatState";

export default function Home() {
  const { messages, setMessages, uploadedFiles, setUploadedFiles } =
    useChatState();
  const [inputValue, setInputValue] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const handleFileUpload = (file: any) => {
    setUploadedFiles((prev) => [...prev, file]);

    const fileMessage: Message = {
      id: Date.now().toString(),
      role: "system",
      content: `File "${file.name}" has been uploaded successfully. You can now ask questions about this document.`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, fileMessage]);
  };

  const handleDeleteFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const clearChat = () => {
    setMessages([]);
  };

  const clearFiles = async () => {
    setUploadedFiles([]);
    try {
      await resetServerState();
      console.log("Server reset successfully");
    } catch (error: any) {
      console.error("Error during reset:", error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Head>
        <title>Document Chat Assistant</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        uploadedFiles={uploadedFiles}
        onFileUpload={handleFileUpload}
        onDeleteFile={handleDeleteFile}
        onClearChat={clearChat}
        onClearFiles={clearFiles}
      />

      <div className="flex-1 flex flex-col">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          fileCount={uploadedFiles.length}
        />

        <ChatContainer
          messages={messages}
          setMessages={setMessages}
          inputValue={inputValue}
          setInputValue={setInputValue}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
          uploadedFiles={uploadedFiles}
        />
      </div>
    </div>
  );
}
