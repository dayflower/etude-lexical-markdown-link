import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  CONTROLLED_TEXT_INSERTION_COMMAND,
  TextNode,
} from "lexical";
import { useEffect } from "react";
import {
  $createMarkdownLinkNode,
  $isMarkdownLinkNode,
  MarkdownLinkNode,
} from "./MarkdownLinkNode";

export default function MarkdownLinkPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // 1a. TextNode → MarkdownLinkNode conversion
    const removeTextTransform = editor.registerNodeTransform(
      TextNode,
      (node) => {
        const parent = node.getParent();
        if ($isMarkdownLinkNode(parent)) {
          const textContent = node.getTextContent();
          const urlMatch = /^\[.*\]\(([^)]*)\)$/.exec(textContent);
          if (!urlMatch) {
            // Pattern broken, so unwrap:
            // Creating a new node would destroy the current selection,
            // so move the inner TextNode out of the parent before removing it
            parent.insertAfter(node);
            parent.remove();
          } else {
            // Update URL if it changed
            const newUrl = urlMatch[1];
            if (parent.__url !== newUrl) {
              parent.getWritable().__url = newUrl;
            }
          }
          return;
        }

        const text = node.getTextContent();
        const regex = /\[([^\]]*)\]\(([^)]+)\)/;
        const match = regex.exec(text);
        if (!match) return;

        const [fullMatch, , url] = match;
        const startIndex = match.index;
        const endIndex = startIndex + fullMatch.length;

        // splitText() automatically preserves the cursor position when splitting nodes
        let linkTextNode: typeof node;
        if (startIndex === 0) {
          [linkTextNode] = node.splitText(endIndex);
        } else {
          [, linkTextNode] = node.splitText(startIndex, endIndex);
        }

        const linkNode = $createMarkdownLinkNode(url);
        linkNode.append($createTextNode(fullMatch));
        linkTextNode.replace(linkNode);
      },
    );

    // 1b. Validation (Node Transform)
    // If the content no longer matches [text](url) format, immediately decompose into TextNodes
    const removeTransform = editor.registerNodeTransform(
      MarkdownLinkNode,
      (node) => {
        const textContent = node.getTextContent();
        const markdownLinkRegex = /^\[.*\]\(.*\)$/;

        if (!markdownLinkRegex.test(textContent)) {
          const children = node.getChildren();
          for (let i = children.length - 1; i >= 0; i--) {
            node.insertAfter(children[i]);
          }
          node.remove();
        }
      },
    );

    // 2. Focus management (Selection Listener)
    // Toggle a CSS class on the DOM based on whether the cursor is inside the node
    const removeUpdateListener = editor.registerUpdateListener(
      ({ editorState }) => {
        editorState.read(() => {
          const selection = $getSelection();

          // Check each MarkdownLinkNode to see if it is selected
          const nodes = document.querySelectorAll(".markdown-link");
          nodes.forEach((dom) => {
            // Using Lexical's internal key for detection (simplified approach)
            // Ideally, class control would go through node.getWritable()
            dom.classList.remove("is-focused");
          });

          if ($isRangeSelection(selection)) {
            const nodes = selection.getNodes();
            nodes.forEach((node) => {
              if ($isMarkdownLinkNode(node)) {
                const element = editor.getElementByKey(node.getKey());
                element?.classList.add("is-focused");
              }
            });
          }
        });
      },
    );

    // 3. Redirect text input to outside the node when the cursor is at the end of a MarkdownLinkNode
    const removeCommandListener = editor.registerCommand(
      CONTROLLED_TEXT_INSERTION_COMMAND,
      (payload) => {
        const text =
          typeof payload === "string" ? payload : (payload as InputEvent).data;
        if (!text) return false;

        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed())
          return false;

        const anchor = selection.anchor;
        const anchorNode = anchor.getNode();
        if (!$isTextNode(anchorNode)) return false;

        const parent = anchorNode.getParent();
        if (!$isMarkdownLinkNode(parent)) return false;
        if (anchor.offset !== anchorNode.getTextContentSize()) return false;

        // Insert text immediately after the MarkdownLinkNode
        const nextSibling = parent.getNextSibling();
        if ($isTextNode(nextSibling)) {
          const current = nextSibling.getTextContent();
          nextSibling.setTextContent(text + current);
          nextSibling.select(text.length, text.length);
        } else {
          const newNode = $createTextNode(text);
          parent.insertAfter(newNode);
          newNode.select(text.length, text.length);
        }
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );

    return () => {
      removeTextTransform();
      removeTransform();
      removeUpdateListener();
      removeCommandListener();
    };
  }, [editor]);

  return null;
}
