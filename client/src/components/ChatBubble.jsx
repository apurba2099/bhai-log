// components/ChatBubble.jsx — Renders text with link detection
import React from "react";
import "./ChatBubble.css";

// Simple URL regex
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

const ChatBubble = ({ text }) => {
  // Split text into parts: regular text and links
  const parts = text.split(URL_REGEX);

  return (
    <div className="bubble">
      {parts.map((part, i) =>
        URL_REGEX.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="chat-link">
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </div>
  );
};

export default ChatBubble;
