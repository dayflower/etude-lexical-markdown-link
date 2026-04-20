import { LinkNode } from "@lexical/link";
import {
  MarkdownLinkLabelNode,
  MarkdownLinkNode,
  MarkdownLinkUrlNode,
} from "./MarkdownLinkNode";

const theme = {
  paragraph: "mb-2",
  link: "text-blue-600 underline hover:text-blue-800 cursor-pointer",
};

function onError(error: Error) {
  console.error(error);
}

export const initialConfig = {
  namespace: "LexicalLinkTest",
  theme,
  onError,
  nodes: [
    LinkNode,
    MarkdownLinkNode,
    MarkdownLinkUrlNode,
    MarkdownLinkLabelNode,
  ],
};
