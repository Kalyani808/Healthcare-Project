import React from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * MarkdownMessage component for rendering AI and user chat bubbles with rich typography,
 * bold highlights, bullet points, headers, and emoji support.
 */
const MarkdownMessage = ({ content, className = '' }) => {
  if (!content) return null;

  return (
    <div className={`markdown-content leading-relaxed text-xs sm:text-sm space-y-2 ${className}`}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-extrabold text-inherit">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          h1: ({ children }) => <h1 className="text-base font-extrabold mt-2 mb-1">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-extrabold mt-2 mb-1">{children}</h2>,
          h3: ({ children }) => <h3 className="text-xs sm:text-sm font-bold mt-1.5 mb-1">{children}</h3>,
          ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-1.5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-1.5">{children}</ol>,
          li: ({ children }) => <li className="leading-snug">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-teal-500 pl-2.5 my-1.5 italic opacity-90">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[11px]">
              {children}
            </code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownMessage;
