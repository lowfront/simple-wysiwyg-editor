export const RegexHttp = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

export function isHTML<K extends keyof HTMLElementTagNameMap>(
  node: Node | null,
  tagName: K
): node is HTMLElementTagNameMap[K] {
  return (
    node?.nodeType === 1 &&
    (node as HTMLElement).tagName === tagName.toUpperCase()
  );
}

export function isText(node: any): node is Text {
  return node?.nodeType === 3;
}

export function getChildNodes(input: HTMLElement | Node) {
  return [...input.childNodes];
}

export function getLastChildNode(node: Node) {
  const childNodes = [...node.childNodes];
  return childNodes[childNodes.length - 1];
}

// FIXME: 구조 정리 및 최적화 고민
export function findPreviousSiblingDeep(root: HTMLElement, node: Node, f: (node: Node) => boolean): Node | null {
  if (!node) throw 'Invalid node';

  let target = node;
  while (target) {
    if (target.previousSibling) {
      const previousSibling = target.previousSibling;
      if (f(previousSibling)) return previousSibling;
      else {
        let lastChild = previousSibling.lastChild;
        if (lastChild) {
          while (lastChild) {
            if (f(lastChild)) {
              return lastChild;
            } else {
              if (lastChild.lastChild) lastChild = lastChild.lastChild;
              else {
                target = lastChild;
                break;
              }
            }
          }
        } else {
          target = previousSibling;
          continue;
        }
      }
    } else {
      if (target.parentNode === root) return null;
      let parentNode = target.parentNode!;
      while (!parentNode.previousSibling && root !== parentNode.parentNode) parentNode = parentNode.parentNode!
      target = parentNode;
    }
  }

  return null;
}

// FIXME: 구조 정리 및 최적화 고민
export function findNextSiblingDeep(root: HTMLElement, node: Node, f: (node: Node) => boolean): Node | null {
  if (!node) throw 'Invalid node';

  let target = node;
  while (target) {
    if (target.nextSibling) {
      const nextSibling = target.nextSibling;
      if (f(nextSibling)) return nextSibling;
      else {
        let firstChild = nextSibling.firstChild;
        if (firstChild) {
          while (firstChild) {
            if (f(firstChild)) {
              return firstChild;
            } else {
              if (firstChild.firstChild) firstChild = firstChild.firstChild;
              else {
                target = firstChild;
                break;
              }
            }
          }
        } else {
          target = nextSibling;
          continue;
        }
      }
    } else {
      if (target.parentNode === root) return null;
      let parentNode = target.parentNode!;
      while (!parentNode.nextSibling && root !== parentNode.parentNode) parentNode = parentNode.parentNode!
      target = parentNode;
    }
  }

  return null;
}

export function previousSiblingTextDeep(root: HTMLElement, node: Node): Node | null {
  if (!node) throw 'Invalid node';

  let target = node;
  while (target) {
    if (target.previousSibling) {
      const previousSibling = target.previousSibling;
      if (isText(previousSibling)) return previousSibling;
      else {
        let lastChild = previousSibling.lastChild;
        if (lastChild) {
          while (lastChild) {
            if (isText(lastChild)) {
              return lastChild;
            } else {
              if (lastChild.lastChild) lastChild = lastChild.lastChild;
              else {
                target = lastChild;
                break;
              }
            }
          }
        } else {
          target = previousSibling;
          continue;
        }
      }
    } else {
      if (target.parentNode === root) return null;
      let parentNode = target.parentNode!;
      while (!parentNode.previousSibling && root !== parentNode.parentNode) parentNode = parentNode.parentNode!
      target = parentNode;
    }
  }

  return null;
}

export function nextSiblingTextDeep(root: HTMLElement, node: Node): Node | null {
  if (!node) throw 'Invalid node';

  let target = node;
  while (target) {
    if (target.nextSibling) {
      const nextSibling = target.nextSibling;
      if (isText(nextSibling)) return nextSibling;
      else {
        let firstChild = nextSibling.firstChild;
        if (firstChild) {
          while (firstChild) {
            if (isText(firstChild)) {
              return firstChild;
            } else {
              if (firstChild.firstChild) firstChild = firstChild.firstChild;
              else {
                target = firstChild;
                break;
              }
            }
          }
        } else {
          target = nextSibling;
          continue;
        }
      }
    } else {
      if (target.parentNode === root) return null;
      let parentNode = target.parentNode!;
      while (!parentNode.nextSibling && root !== parentNode.parentNode) parentNode = parentNode.parentNode!
      target = parentNode;
    }
  }

  return null;
}

export function createPromise<T>() {
  let resolve: (value: T) => void;
  return [new Promise<T>((res) => (resolve = res)), resolve!];
}

export function insertAfter(node: Node, child: Node, parent: Node = child.parentNode!) {
  if (child.nextSibling) {
    parent.insertBefore(node, child.nextSibling);
  } else {
    parent.appendChild(node);
  }
}

export function isWrappedInTag(root: Node, node: Node, tagName: string) {
  while (node && node !== root) {
    if ((node.parentNode as HTMLElement)?.tagName === tagName.toUpperCase()) return true;
    node = node.parentNode!;
  }
  return false;
}
export function getWrappedInTag<K extends keyof HTMLElementTagNameMap>(root: Node, node: Node, tagName: K) {
  while (node && node !== root) {
    if ((node.parentNode as HTMLElement)?.tagName === tagName.toUpperCase()) return node.parentNode as HTMLElementTagNameMap[K];
    node = node.parentNode!;
  }
  return null;
}

export function removeIfEmpty(root: Node, node: Node) {
  while (node && node !== root) {
    if (node.firstChild) break;
    node.parentNode!.removeChild(node);
    node = node.parentNode!;
  }
}

export function validAnchorElement(anchorElement: HTMLAnchorElement) {
  if (RegexHttp.test(anchorElement.textContent ?? '')) {
    anchorElement.href = anchorElement.textContent!;
  } else  {
    const anchorParent = anchorElement.parentNode!;
    [...anchorElement.childNodes].forEach(node => anchorParent.insertBefore(node, anchorElement));
    anchorParent.removeChild(anchorElement);
  }
}