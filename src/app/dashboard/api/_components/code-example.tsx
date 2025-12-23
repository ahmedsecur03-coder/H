'use client';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export const CodeExample = ({ code, language }: { code: string; language: string }) => {
    return (
         <div className="rounded-md overflow-hidden bg-[#1E1E1E]">
            <SyntaxHighlighter language={language} style={vscDarkPlus} customStyle={{ margin: 0, padding: '1.5rem', direction: 'ltr' }}>
                {code.trim()}
            </SyntaxHighlighter>
        </div>
    );
};
