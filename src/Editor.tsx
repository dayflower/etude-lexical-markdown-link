import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { useState } from "react";
import { initialConfig } from "./editorConfig";
import MarkdownLinkPlugin from "./MarkdownLinkPlugin";

export default function Editor() {
  const [showBrackets, setShowBrackets] = useState(false);

  return (
    <div className="space-y-2">
      <LexicalComposer initialConfig={initialConfig}>
        <div
          className={`border border-gray-300 rounded-lg overflow-hidden${showBrackets ? " show-brackets" : ""}`}
        >
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="min-h-40 p-4 outline-none focus:ring-2 focus:ring-blue-400" />
            }
            placeholder={
              <div className="pointer-events-none absolute top-4 left-4 text-gray-400">
                Start typing...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <LinkPlugin />
          <MarkdownLinkPlugin />
        </div>
      </LexicalComposer>
      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={showBrackets}
          onChange={(e) => setShowBrackets(e.target.checked)}
          className="cursor-pointer"
        />
        Show brackets
      </label>
    </div>
  );
}
