"use client";

import { Bot, Upload, FileText, MessageSquare, Zap } from "lucide-react";

interface EmptyStateProps {
  uploadedFiles: any[];
}

export default function EmptyState({ uploadedFiles }: EmptyStateProps) {
  const suggestions = [
    "Summarize the main points of this document",
    "What are the key findings in this report?",
    "Explain the technical concepts mentioned",
    "Create a bullet-point summary",
    "What questions does this document answer?",
    "Compare different sections of the document",
  ];

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Main Icon */}
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
            <Bot className="h-10 w-10 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
        </div>

        {/* Welcome Message */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to Doc AI
          </h1>
          <p className="text-lg text-gray-600">
            Your intelligent document chat assistant
          </p>
        </div>

        {/* Status */}
        {uploadedFiles.length === 0 ? (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Upload className="h-8 w-8 text-blue-600" />
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Get Started by Uploading Documents
              </h3>
              <p className="text-blue-700 mb-4">
                Upload your documents and start having intelligent conversations
                about their content.
              </p>
              <div className="text-sm text-blue-600 space-y-1">
                <p>✓ PDF, Word, Excel, and text files supported</p>
                <p>✓ Secure and private processing</p>
                <p>✓ Instant analysis and insights</p>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              <p>
                Click the menu button in the top-left corner to access the file
                upload area
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <MessageSquare className="h-8 w-8 text-green-600" />
                <Bot className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Ready to Chat!
              </h3>
              <p className="text-green-700 mb-4">
                I've processed your {uploadedFiles.length} document
                {uploadedFiles.length !== 1 ? "s" : ""}. Ask me anything about
                the content!
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
                <FileText className="h-4 w-4" />
                <span>{uploadedFiles.map((file) => file.name).join(", ")}</span>
              </div>
            </div>

            {/* Suggestions */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900">
                Try asking me:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group"
                    onClick={() => {
                      const event = new CustomEvent("suggestion-click", {
                        detail: suggestion,
                      });
                      window.dispatchEvent(event);
                    }}
                  >
                    <p className="text-sm text-gray-700 group-hover:text-blue-700 transition-colors">
                      "{suggestion}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900">Document Analysis</h4>
            <p className="text-sm text-gray-600">
              Extract insights and answer questions from your documents
            </p>
          </div>

          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
              <MessageSquare className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="font-medium text-gray-900">Natural Conversation</h4>
            <p className="text-sm text-gray-600">
              Chat naturally about your document content
            </p>
          </div>

          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
              <Zap className="h-6 w-6 text-purple-600" />
            </div>
            <h4 className="font-medium text-gray-900">Instant Results</h4>
            <p className="text-sm text-gray-600">
              Get immediate answers and summaries
            </p>
          </div>
        </div> */}
      </div>
    </div>
  );
}
