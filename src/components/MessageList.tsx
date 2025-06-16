"use client";

import { Message } from "../types";
import MessageBubble from "./MessageBubble";

interface MessageListProps {
  messages: Message[];
  onRetry: (messageId: string) => void;
  onEdit: (messageId: string, newContent: string) => void;
  onDelete: (messageId: string) => void;
}

export default function MessageList({
  messages,
  onRetry,
  onEdit,
  onDelete,
}: MessageListProps) {
  return (
    <div className="px-4 py-6 space-y-6 max-w-4xl mx-auto">
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          message={message}
          isLast={index === messages.length - 1}
          onRetry={onRetry}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
