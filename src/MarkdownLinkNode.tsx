import {
  type EditorConfig,
  ElementNode,
  type LexicalNode,
  type NodeKey,
  type SerializedElementNode,
  type Spread,
} from "lexical";

export type SerializedMarkdownLinkNode = Spread<
  { url: string },
  SerializedElementNode
>;

export class MarkdownLinkNode extends ElementNode {
  __url: string;

  static getType(): string {
    return "markdown-link";
  }
  static clone(node: MarkdownLinkNode): MarkdownLinkNode {
    return new MarkdownLinkNode(node.__url, node.__key);
  }

  constructor(url: string, key?: NodeKey) {
    super(key);
    this.__url = url;
  }

  // DOMの作成：常に特定のクラスを付与しておく
  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement("span");
    dom.className = "markdown-link";
    // URLをデータ属性に持たせておくとCSSで活用できる
    dom.setAttribute("data-url", this.__url);
    return dom;
  }

  updateDOM(prevNode: MarkdownLinkNode, dom: HTMLElement): boolean {
    if (prevNode.__url !== this.__url) {
      dom.setAttribute('data-url', this.__url);
    }
    return false;
  }

  static importJSON(
    serializedNode: SerializedMarkdownLinkNode,
  ): MarkdownLinkNode {
    return new MarkdownLinkNode(serializedNode.url);
  }

  exportJSON(): SerializedMarkdownLinkNode {
    return {
      ...super.exportJSON(),
      type: "markdown-link",
      url: this.__url,
      version: 1,
    };
  }

  canBeEmpty(): false {
    return false;
  }
  isInline(): true {
    return true;
  }
}

export function $createMarkdownLinkNode(url: string): MarkdownLinkNode {
  return new MarkdownLinkNode(url);
}

export function $isMarkdownLinkNode(
  node: LexicalNode | null | undefined,
): node is MarkdownLinkNode {
  return node instanceof MarkdownLinkNode;
}
