import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { LinkNode } from "@lexical/link";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { MarkdownLinkNode } from "./MarkdownLinkNode";
import MarkdownLinkPlugin from "./MarkdownLinkPlugin";

const theme = {
  paragraph: "mb-2",
  link: "text-blue-600 underline hover:text-blue-800 cursor-pointer",
};

function onError(error: Error) {
  console.error(error);
}

const initialConfig = {
  namespace: "LexicalLinkTest",
  theme,
  onError,
  nodes: [LinkNode, MarkdownLinkNode],
};

export default function Editor() {
  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="min-h-40 p-4 outline-none focus:ring-2 focus:ring-blue-400" />
          }
          placeholder={
            <div className="pointer-events-none absolute top-4 left-4 text-gray-400">
              テキストを入力してください...
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
  );
}
