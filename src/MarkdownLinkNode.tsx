import {
  type EditorConfig,
  ElementNode,
  type LexicalNode,
  type NodeKey,
  type SerializedElementNode,
  type Spread,
} from "lexical";

export type SerializedMarkdownLinkNode = Spread<
  { url: string; label: string },
  SerializedElementNode
>;

export class MarkdownLinkNode extends ElementNode {
  __url: string;
  __label: string;

  static getType(): string {
    return "markdown-link";
  }

  static clone(node: MarkdownLinkNode): MarkdownLinkNode {
    return new MarkdownLinkNode(node.__label, node.__url, node.__key);
  }

  constructor(label: string, url: string, key?: NodeKey) {
    super(key);
    this.__label = label;
    this.__url = url;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const dom = document.createElement("span");
    dom.className = "markdown-link";
    dom.setAttribute("data-url", this.__url);
    dom.setAttribute("data-label", this.__label);
    return dom;
  }

  updateDOM(prevNode: MarkdownLinkNode, dom: HTMLElement): boolean {
    if (prevNode.__url !== this.__url) {
      dom.setAttribute("data-url", this.__url);
    }
    if (prevNode.__label !== this.__label) {
      dom.setAttribute("data-label", this.__label);
    }
    return false;
  }

  static importJSON(
    serializedNode: SerializedMarkdownLinkNode,
  ): MarkdownLinkNode {
    return new MarkdownLinkNode(serializedNode.label, serializedNode.url);
  }

  exportJSON(): SerializedMarkdownLinkNode {
    return {
      ...super.exportJSON(),
      type: "markdown-link",
      url: this.__url,
      label: this.__label,
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

export function $createMarkdownLinkNode(
  label: string,
  url: string,
): MarkdownLinkNode {
  return new MarkdownLinkNode(label, url);
}

export function $isMarkdownLinkNode(
  node: LexicalNode | null | undefined,
): node is MarkdownLinkNode {
  return node instanceof MarkdownLinkNode;
}
