// File: components/MessageItem.tsx
import { Message } from '../types';

interface MessageItemProps {
  message: Message;
}

export default function MessageItem({ message }: MessageItemProps) {
  const formattedTime = new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: 'numeric',
  }).format(message.timestamp);
  
  return (
    <div className="flex items-start">
      {message.role === 'assistant' ? (
        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-indigo-600">
            <path d="M16 4C9.37 4 4 9.37 4 16C4 22.63 9.37 28 16 28C22.63 28 28 22.63 28 16C28 9.37 22.63 4 16 4Z" fill="currentColor"/>
          </svg>
        </div>
      ) : (
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-4">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-600">
            <path d="M16 4C9.37 4 4 9.37 4 16C4 22.63 9.37 28 16 28C22.63 28 28 22.63 28 16C28 9.37 22.63 4 16 4ZM16 6C21.52 6 26 10.48 26 16C26 21.52 21.52 26 16 26C10.48 26 6 21.52 6 16C6 10.48 10.48 6 16 6ZM16 8C13.83 8 12 9.83 12 12C12 14.17 13.83 16 16 16C18.17 16 20 14.17 20 12C20 9.83 18.17 8 16 8ZM8 22C8 19.03 13.33 17.5 16 17.5C18.67 17.5 24 19.03 24 22V24H8V22Z" fill="currentColor"/>
          </svg>
        </div>
      )}
      
      <div className="flex-1">
        <div 
          className={`py-3 px-4 rounded-xl ${
            message.role === 'assistant' 
              ? 'bg-gray-100 text-black rounded-tl-none' 
              : 'bg-indigo-50 text-black rounded-tr-none'
          }`}
        >
          <div className="prose prose-sm max-w-none">
            {message.content}
          </div>
        </div>
        <div className="mt-1 text-xs text-gray-500 ml-2">
          {formattedTime}
        </div>
      </div>
    </div>
  );
}
