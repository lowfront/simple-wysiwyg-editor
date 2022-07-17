import Parser from "./Parser";
import { getChildNodes, isText } from "./utils";

namespace Editor {
  export function getSelection() {
    const test: Selection = 0 as any;

    return window.getSelection() as Selection & {
      anchorNode: Node;
      focusNode: Node;
    };
  }

  export function focus(node: Node, offset: number) {
    const selection = getSelection();
    const range = document.createRange();
    range.setStart(node, offset);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  export function deepFocus(node: Node, offset: number) {
    const { node: targetNode, offset: targetOffset } = Parser.getDeepOffsetText(node, offset);
    Editor.focus(targetNode, targetOffset);
  }

  export function appendParagraph(
    input: HTMLElement,
    textContent?: string | Text, // if textContent is falsy, return <p><br></p>;
    insertIndex?: number
  ) {
    const p = document.createElement("p");
    if (textContent) {
      if (isText(textContent)) {
        p.appendChild(textContent);
      } else {
        p.appendChild(document.createTextNode(textContent));
      }
    } else {
      p.appendChild(document.createElement("br"));
    }

    const childNodes = getChildNodes(input);
    const insertTargetNode = childNodes[insertIndex ?? -1];
    if (insertTargetNode) {
      input.insertBefore(p, insertTargetNode);
    } else {
      input.append(p);
    }
    return p;
  }

  export function hasOneEmptyParagraph(input: HTMLElement) {
    return !input.firstChild?.nextSibling && !input.firstChild!.textContent;
  }
  export function indexOf(input: HTMLElement, node: Node) {
    return getChildNodes(input).indexOf(node as ChildNode);
  }
}

export default Editor;
