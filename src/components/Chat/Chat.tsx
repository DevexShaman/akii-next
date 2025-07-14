// src/components/Chat/Chat.tsx

"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { resetError, sendChatMessage } from "@/store/slices/chatSlice";
import { FiSend, FiArrowUp, FiRefreshCw, FiX } from "react-icons/fi";
import { FaRobot, FaUser } from "react-icons/fa";
import Markdown from "react-markdown";

const Chat = () => {
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((state) => state.chat);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [classInput, setClassInput] = useState("");
  const [subjectInput, setSubjectInput] = useState("");
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      text: string;
      sender: "user" | "ai";
      timestamp: Date;
    }>
  >([]);

  const isLoading = status === "loading";

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || !classInput || !subjectInput || isLoading) return;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user" as const,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");

    try {
      // Send to API
      const result = await dispatch(
        sendChatMessage({
          question: currentInput,
          student_class: classInput,
          subject: subjectInput,
        })
      ).unwrap();

      // Add AI response
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: result.answer,
          sender: "ai" as const,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: "Sorry, I encountered an error. Please try again.",
          sender: "ai" as const,
          timestamp: new Date(),
        },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white">
        <h1 className="text-2xl font-bold">Study Assistant</h1>
        <p className="text-blue-200">Ask anything about your subjects</p>
      </div>

      {/* Class/Subject Selector */}
      <div className="flex p-4 space-x-3 border-b">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Class/Grade
          </label>
          <input
            type="text"
            value={classInput}
            onChange={(e) => setClassInput(e.target.value)}
            placeholder="e.g., 10th Grade"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject
          </label>
          <input
            type="text"
            value={subjectInput}
            onChange={(e) => setSubjectInput(e.target.value)}
            placeholder="e.g., Mathematics"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mb-4 flex items-center justify-center">
              <FaRobot className="text-3xl text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Welcome to Study Assistant!
            </h3>
            <p className="text-gray-500 max-w-md">
              Enter your class and subject, then ask your first question to get
              started with AI-powered learning help.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white border border-gray-200 rounded-bl-none"
                  }`}
                >
                  <div className="flex items-center mb-1">
                    {message.sender === "ai" ? (
                      <FaRobot className="mr-2 text-indigo-600" />
                    ) : (
                      <FaUser className="mr-2 text-blue-400" />
                    )}
                    <span className="text-xs font-medium">
                      {message.sender === "ai" ? "Study Assistant" : "You"}
                    </span>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <Markdown>{message.text}</Markdown>
                  </div>
                  <div
                    className={`text-xs mt-2 ${
                      message.sender === "user"
                        ? "text-blue-200"
                        : "text-gray-500"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3">
                  <div className="flex items-center">
                    <FaRobot className="mr-2 text-indigo-600" />
                    <span className="text-xs font-medium">Study Assistant</span>
                  </div>
                  <div className="flex items-center mt-2">
                    <FiRefreshCw className="animate-spin text-indigo-600 mr-2" />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-200 p-4 bg-white"
      >
        {error && (
          <div className="text-red-500 text-sm mb-2 flex items-center">
            <span className="bg-red-100 px-2 py-1 rounded">{error}</span>
            <button
              type="button"
              onClick={() => dispatch(resetError())}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              <FiX />
            </button>
          </div>
        )}
        <div className="flex">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask your question..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading || !classInput || !subjectInput}
          />
          <button
            type="submit"
            disabled={
              isLoading || !inputValue.trim() || !classInput || !subjectInput
            }
            className={`px-5 rounded-r-lg flex items-center justify-center ${
              isLoading || !inputValue.trim() || !classInput || !subjectInput
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading ? (
              <FiRefreshCw className="animate-spin text-white" />
            ) : (
              <FiArrowUp className="text-white" />
            )}
          </button>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>
            {!classInput || !subjectInput
              ? "Please enter class and subject"
              : "Press Enter to send"}
          </span>
          <span>{inputValue.length}/500</span>
        </div>
      </form>
    </div>
  );
};

export default Chat;
