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
    // 1a. TextNode → MarkdownLinkNode への変換
    const removeTextTransform = editor.registerNodeTransform(
      TextNode,
      (node) => {
        const parent = node.getParent();
        if ($isMarkdownLinkNode(parent)) {
          const textContent = node.getTextContent();
          const urlMatch = /^\[.*\]\(([^)]*)\)$/.exec(textContent);
          if (!urlMatch) {
            // パターンが崩れたのでアンラップ:
            // 新しいノードを作ると選択中ノードが消えてセレクションが失われるため、
            // 内側のTextNodeをそのまま親の外に移してから親を削除する
            parent.insertAfter(node);
            parent.remove();
          } else {
            // URLが変わっていれば更新
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

        // splitText() でノードを分割するとカーソル位置が自動的に正しく保持される
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

    // 1b. バリデーション (Node Transform)
    // 内容が [text](url) の形式を外れたら、即座にTextNodeに分解する
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

    // 2. フォーカス管理 (Selection Listener)
    // カーソルがノード内にあるかどうかで、DOMにクラスを付け外しする
    const removeUpdateListener = editor.registerUpdateListener(
      ({ editorState }) => {
        editorState.read(() => {
          const selection = $getSelection();

          // 全てのMarkdownLinkNodeに対して、選択されているかチェック
          const nodes = document.querySelectorAll(".markdown-link");
          nodes.forEach((dom) => {
            // Lexicalの内部Keyを取得して判定（簡易的な実装例）
            // 実際には node.getWritable() を通じてクラスを制御するのが理想的
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

    // 3. カーソルがMarkdownLinkNode末尾にある状態でのテキスト入力をノード外に逃がす
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

        // MarkdownLinkNodeの直後にテキストを挿入する
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
