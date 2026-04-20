# Architecture

This is a React + Lexical rich text editor etude implementing Markdown-style link (`[label](url)`) editing. The build outputs to `docs/` for GitHub Pages deployment.

## Editor structure

`Editor.tsx` sets up a `LexicalComposer` with a dual-panel layout (rich editor left, Markdown source preview right). The custom plugins handle all the link logic:

- **`MarkdownLinkPlugin`** — the core plugin, composed of five hooks (see below)
- **`MarkdownPreviewPlugin`** — serializes editor state to Markdown for the live preview panel
- **`editorConfig.ts`** — registers custom nodes and sets initial editor state

## Custom node types (`MarkdownLinkNode.tsx`)

- `MarkdownLinkNode` (`ElementNode`) — wrapper node that stores `__label` and `__url`; its children are literal bracket/paren text nodes interspersed with:
  - `MarkdownLinkLabelNode` (`TextNode` subclass) — editable label text
  - `MarkdownLinkUrlNode` (`TextNode` subclass) — editable URL text

Both text node subclasses are generated via a shared factory to avoid duplication.

## MarkdownLinkPlugin hooks (`MarkdownLinkPlugin.tsx`)

1. **`useNodeTransforms`** — regex-based detection of `[label](url)` patterns; wraps matching text into link nodes and unwraps broken ones back to plain text
2. **`useSelectionFocusTracking`** — adds/removes `.is-focused` CSS class on the enclosing link node to track cursor position
3. **`useTextInsertionBehavior`** — redirects text typed immediately after a link to the next sibling, protecting the link's internal structure
4. **`useEscapeKeyBehavior`** — moves cursor outside the link on Escape (exits source mode)
5. **`useClickHandling`** — dual-mode: click outside link enters source mode; click on URL portion in source mode opens it in a new tab

## CSS-driven visual modes

The link-mode / source-mode visual difference is entirely CSS-driven via the `.is-focused` class — no JS re-render needed. Class name constants are centralized in `constants.ts`.

- **Link mode** (`.markdown-link:not(.is-focused)`): hides raw syntax, shows only the styled label with an external-link icon
- **Source mode** (`.markdown-link.is-focused`): reveals full `[label](url)` syntax for editing
- **Show-brackets mode** (`.show-brackets`): renders faint `[` `]` around labels even in link mode
