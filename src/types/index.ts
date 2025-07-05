// File: types/index.ts
export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }
  
  export interface ChatProps {
    messages: Message[];
    inputValue: string;
    setInputValue: (value: string) => void;
    handleSendMessage: () => void;
    isProcessing: boolean;
    onTranscribedText: (text: string) => void;
  }
  