import { $generateHtmlFromNodes } from "@lexical/html";
import type { BaseSelection, LexicalEditor } from "lexical";

/**
 * Serializes a live editor's current content to semantic HTML.
 *
 * A thin wrapper around the standard `$generateHtmlFromNodes` that handles the
 * required `editor.read()`, so callers don't have to import `@lexical/html` or
 * remember the read wrapper. Pass a `selection` to export only the selected
 * nodes.
 *
 * Custom nodes' `exportDOM` decides the output: `MarkdownLinkNode` emits
 * `<a href="url">label</a>` rather than the editing DOM (a `<span data-url>`
 * wrapping the literal `[label](url)` syntax).
 */
export function getEditorHtml(
  editor: LexicalEditor,
  selection?: BaseSelection | null,
): string {
  return editor.read(() => $generateHtmlFromNodes(editor, selection));
}
