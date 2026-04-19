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

const FULL_MATCH_REGEX = /^\[([^\]]*)\]\(([^)]*)\)$/;
const MATCH_REGEX = /\[([^\]]*)\]\(([^)]+)\)/;

export default function MarkdownLinkPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // TextNode → MarkdownLinkNode conversion and in-place sync
    const removeTextTransform = editor.registerNodeTransform(
      TextNode,
      (node) => {
        const parent = node.getParent();
        if ($isMarkdownLinkNode(parent)) {
          const textContent = node.getTextContent();
          const urlMatch = FULL_MATCH_REGEX.exec(textContent);
          if (!urlMatch) {
            // Pattern broken: unwrap the TextNode so the cursor position is preserved
            parent.insertAfter(node);
            parent.remove();
          } else {
            const [, newLabel, newUrl] = urlMatch;
            if (parent.__url !== newUrl || parent.__label !== newLabel) {
              const writable = parent.getWritable();
              writable.__url = newUrl;
              writable.__label = newLabel;
            }
          }
          return;
        }

        const text = node.getTextContent();
        const match = MATCH_REGEX.exec(text);
        if (!match) return;

        const [fullMatch, label, url] = match;
        const startIndex = match.index;
        const endIndex = startIndex + fullMatch.length;

        let linkTextNode: typeof node;
        if (startIndex === 0) {
          [linkTextNode] = node.splitText(endIndex);
        } else {
          [, linkTextNode] = node.splitText(startIndex, endIndex);
        }

        const linkNode = $createMarkdownLinkNode(label, url);
        linkNode.append($createTextNode(fullMatch));
        linkTextNode.replace(linkNode);
      },
    );

    // MarkdownLinkNode validator: unwrap if the content is no longer a valid markdown link
    const removeTransform = editor.registerNodeTransform(
      MarkdownLinkNode,
      (node) => {
        if (!FULL_MATCH_REGEX.test(node.getTextContent())) {
          const children = node.getChildren();
          for (let i = children.length - 1; i >= 0; i--) {
            node.insertAfter(children[i]);
          }
          node.remove();
        }
      },
    );

    // Toggle .is-focused on MarkdownLinkNode DOM elements based on the selection
    const removeUpdateListener = editor.registerUpdateListener(
      ({ editorState }) => {
        editorState.read(() => {
          const doms = document.querySelectorAll(".markdown-link");
          doms.forEach((dom) => {
            dom.classList.remove("is-focused");
          });

          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;

          const focusedKeys = new Set<string>();
          for (const n of selection.getNodes()) {
            if ($isMarkdownLinkNode(n)) {
              focusedKeys.add(n.getKey());
            } else if ($isTextNode(n)) {
              const parent = n.getParent();
              if ($isMarkdownLinkNode(parent)) {
                focusedKeys.add(parent.getKey());
              }
            }
          }
          focusedKeys.forEach((key) => {
            editor.getElementByKey(key)?.classList.add("is-focused");
          });
        });
      },
    );

    // When the cursor sits at the very end of a MarkdownLinkNode (just after `)`),
    // redirect text insertion to the outside so the closing paren is preserved.
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
