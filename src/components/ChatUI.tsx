// File: components/ChatUI.tsx
import { useRef, useEffect } from "react";
import { ChatProps, Message } from "../types";
import MessageItem from "./MessageItem";
import ChatInput from "./ChatInput";

export default function ChatUI({
  messages,
  inputValue,
  setInputValue,
  handleSendMessage,
  isProcessing,
  onTranscribedText,
}: ChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6 flex items-center">
        <div className="w-8 h-8 mr-3">
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-indigo-600"
          >
            <path
              d="M16 4C9.37 4 4 9.37 4 16C4 22.63 9.37 28 16 28C22.63 28 28 22.63 28 16C28 9.37 22.63 4 16 4ZM16 26C10.48 26 6 21.52 6 16C6 10.48 10.48 6 16 6C21.52 6 26 10.48 26 16C26 21.52 21.52 26 16 26Z"
              fill="currentColor"
            />
            <path
              d="M16 10C14.9 10 14 10.9 14 12C14 13.1 14.9 14 16 14C17.1 14 18 13.1 18 12C18 10.9 17.1 10 16 10Z"
              fill="currentColor"
            />
            <path
              d="M16 16C15.45 16 15 16.45 15 17V22C15 22.55 15.45 23 16 23C16.55 23 17 22.55 17 22V17C17 16.45 16.55 16 16 16Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <h1 className="text-xl font-medium text-gray-800">CaseBase </h1>
      </header>

      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto p-6 bg-white">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <h2 className="text-2xl font-semibold mb-2">
              How can I help you today?
            </h2>
            <p className="text-center max-w-md">
              You can also use the microphone button to speak your questions.
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message: Message) => (
              <MessageItem key={message.id} message={message} />
            ))}
            {isProcessing && (
              <div className="flex items-start">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                  <svg
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-indigo-600"
                  >
                    <path
                      d="M16 4C9.37 4 4 9.37 4 16C4 22.63 9.37 28 16 28C22.63 28 28 22.63 28 16C28 9.37 22.63 4 16 4Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div className="flex space-x-2 bg-gray-100 py-3 px-4 rounded-xl rounded-tl-none">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            inputValue={inputValue}
            setInputValue={setInputValue}
            onSendMessage={handleSendMessage}
            onTranscribedText={onTranscribedText}
            isProcessing={isProcessing}
            hasFiles={false}
          />
        </div>
      </div>
    </div>
  );
}
