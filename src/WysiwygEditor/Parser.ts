import { findPreviousSiblingDeep, getChildNodes, getLastChildNode, isHTML, isText, findNextSiblingDeep } from "./utils";

namespace Parser {
  export function isLast(input: HTMLElement, node: Node, offset: number) {
    if (input === node && getChildNodes(input).length - 1 === offset)
      return true;

    let targetNode = node;
    let isLast = isText(targetNode)
      ? targetNode.textContent!.length === offset
      : true;

    while (isLast && input !== targetNode) {
      isLast &&= getLastChildNode(targetNode.parentNode!) === targetNode;
      targetNode = targetNode.parentNode!;
    }

    return isLast;
  }

  export function isLastOfParagraph(
    input: HTMLElement,
    node: Node,
    offset: number
  ) {
    let targetNode = node;
    let isLast = isText(targetNode)
      ? targetNode.textContent!.length === offset
      : true;

    while (isLast && input !== targetNode) {
      isLast &&= getLastChildNode(targetNode.parentNode!) === targetNode;
      targetNode = targetNode.parentNode!;
    }

    return isLast;
  }

  export function getCurrentParagraph(input: HTMLElement, node: Node) {
    let targetNode = node;
    while (!isHTML(targetNode, "p")) targetNode = targetNode.parentNode!;

    return targetNode;
  }

  // FIXME: 가드 처리 위치 고민 필요
  function getTextNodesConnectedPrevious(parent: HTMLElement, cursorNode: Text) {
    if (cursorNode.data[0] === ' ') return [];

    const stack: Node[] = [cursorNode];
    const result = [];

    let target: Node;
    while (target = stack.shift()!) {
      if (isText(target)) {
        if (cursorNode !== target) {
          result.unshift(target);

          if (/\s/.test(target.data)) {
            break;
          }
        }

        if (target.previousSibling) {
          stack.push(target.previousSibling);
        } else {
          let parentNode = target.parentNode!;
          while (!parentNode.previousSibling && parent !== parentNode) parentNode = parentNode.parentNode!

          if (parentNode.previousSibling) stack.push(parentNode.previousSibling);
        }
      } else {
        if (target.lastChild) {
          stack.push(target.lastChild);
        }
      }
    }

    return result;
  }

  // FIXME: 가드 처리 위치 고민 필요
  function getTextNodesConnectedNext(parent: HTMLElement, cursorNode: Text) {
    if (cursorNode.data[cursorNode.data.length - 1] === ' ') return [];

    const stack: Node[] = [cursorNode];
    const result = [];

    let target: Node;
    while (target = stack.shift()!) {
      if (isText(target)) {
        if (cursorNode !== target) {
          result.unshift(target);

          if (/\s/.test(target.data)) {
            break;
          }
        }

        if (target.nextSibling) {
          stack.push(target.nextSibling);
        } else {
          let parentNode = target.parentNode!;
          while (!parentNode.nextSibling && parent !== parentNode) parentNode = parentNode.parentNode!

          if (parentNode.nextSibling) stack.push(parentNode.nextSibling);
        }
      } else {
        if (target.firstChild) {
          stack.push(target.firstChild);
        }
      }
    }

    return result;
  }

  function isDeepPreviousAnchor(parent: HTMLElement, cursorNode: Text) {
    return findPreviousSiblingDeep(parent, cursorNode, node => isHTML(node, 'a'))
  }

  function isDeepNextAnchor(parent: HTMLElement, cursorNode: Text) {
    return findNextSiblingDeep(parent, cursorNode, node => isHTML(node, 'a'))
  }

  export function getConnectedTextNodesExceptLink(parent: HTMLElement, cursorNode: Text) {
    const previousConnectedTextNodes = isDeepPreviousAnchor(parent, cursorNode) ? [] : getTextNodesConnectedPrevious(parent, cursorNode);
    const nextConnectedTextNodes = isDeepNextAnchor(parent, cursorNode) ? [] : getTextNodesConnectedNext(parent, cursorNode);

    const result = [
      ...previousConnectedTextNodes,
      cursorNode,
      ...nextConnectedTextNodes,
    ];

    return result;
  }

  export function getDeepOffsetText(node: Node, offset: number) {
    const initOffset = offset;
    const stack: Node[] = [node];
    let target: Node|undefined;
    while (target = stack.shift()) {
      if (isText(target)) {
        if (target.data.length < offset) {
          offset -= target.data.length;
        } else {
          break;
        }
      } else {
        stack.unshift(...[...target.childNodes]);
      }
    }
    if (!target) throw new Error(`Invalid offset: ${initOffset}`);

    return {
      node: target,
      offset
    };
  }
}

export default Parser;
