import Editor from "./Editor";
import Parser from "./Parser";
import { findPreviousSiblingDeep, getChildNodes, getLastChildNode, getWrappedInTag, insertAfter, isHTML, isText, isWrappedInTag, previousSiblingTextDeep, RegexHttp, removeIfEmpty, validAnchorElement } from "./utils";

namespace Transform {
  export function initWrap(input: HTMLElement) {
    lastWrap(input);
  }

  export function lastWrap(input: HTMLElement) {
    if (getChildNodes(input).length === 0) {
      Editor.appendParagraph(input);
    }
  }

  export function linkTransform(input: HTMLElement, ev: InputEvent) {
    const selection = Editor.getSelection();
    const { anchorNode, anchorOffset } = selection;

    const paragraph = Parser.getCurrentParagraph(input, anchorNode);
    const a = findPreviousSiblingDeep(paragraph, anchorNode, node => isHTML(node, 'a')) as HTMLAnchorElement|null;
    if (isText(anchorNode) && !/^\s$/.test(anchorNode.data) && anchorNode.data.length === 1 && a) {
      // link merge
      if (RegexHttp.test(a.textContent + anchorNode.data)) {
        const char = anchorNode.splitText(0);
        const textNode = previousSiblingTextDeep(paragraph,anchorNode) as Text;
        textNode.data += char.data;
        a.href = textNode.data;
        char.remove();

        return;
      }
    }

    if (isText(anchorNode) && !isWrappedInTag(paragraph, anchorNode, 'a')) {
      const textNodes = Parser.getConnectedTextNodesExceptLink(paragraph, anchorNode);
      const textContent = textNodes.reduce((acc, { data }) => acc + data, '');

      const matchArray = textContent.match(RegexHttp);
      if (!matchArray) return;
      // console.log('[matchArray]', matchArray, anchorNode, anchorOffset);
      const { 0: linkText, index } = matchArray as RegExpMatchArray & { index: number };
      const focusOffset = textContent.indexOf(anchorNode.data) - index + anchorOffset; // textContent에서 anchorNode가 시작하는 위치에서 link 시작부분을 빼면 anchorNode와 같은 offset을 갖게 됨. 이를 더해서 링크에서 focusOffset을 구할 수 있음
      
      let length = index;
      let linkStart!: Text;
      let linkStartOffset!: number;
      let linkEnd!: Text;
      let linkEndOffset!: number;
      for (const text of textNodes) {
        const textLength = text.data.length;
        if (!linkStart && textLength - length > 0) {
          linkStart = text;
          linkStartOffset = length;
        }

        if (textLength - (length + linkText.length) >= 0) {
          linkEnd = text;
          linkEndOffset = length + linkText.length;
          break;
        }

        length -= textLength;
      }
      console.log('textNodes', textNodes);
      console.log('linkStart', linkStart.data, linkStartOffset);
      console.log('linkEnd', linkEnd.data, linkEndOffset);
      
      const startSplitedNodeArray = deepSplitText(paragraph, linkStart, linkStartOffset);
      console.log('startSplitedNodeArray', startSplitedNodeArray)

      if (linkStart === linkEnd) {
        console.log('same link node')
        linkEnd = startSplitedNodeArray[0] as Text;
        linkEndOffset = linkText.length;
      }
      console.log('linkEnd2', linkEnd, linkEnd.data, linkEndOffset);

      const endSplitedNodeArray = deepSplitText(paragraph, linkEnd, linkEndOffset);

      console.log('endSplitedNodeArray', endSplitedNodeArray)
      const linkChildNodes = startSplitedNodeArray.filter(item => !endSplitedNodeArray.includes(item));

      console.log('[linkChildNodes]', linkChildNodes);

      if (!linkChildNodes.length) return;

      const a = document.createElement('a');
      a.href = linkChildNodes.reduce((acc, { textContent }) => acc + textContent, '');
      paragraph.insertBefore(a, linkChildNodes[0]);
      linkChildNodes.forEach(node => a.appendChild(node));

      console.log('[anchorNode]', anchorNode);
      Editor.deepFocus(a, focusOffset);
    }
  }

  export function enterTransform(input: HTMLElement, ev: InputEvent) {
    ev.preventDefault();

    const selection = Editor.getSelection();
    const { anchorNode, anchorOffset } = selection;

    let focusNode: Node = input;
    let focusOffset: number = -1;

    /* a tag cleanup after enter */
    const previousAnchor = findPreviousSiblingDeep(input, anchorNode, node => isHTML(node, 'a'));
    if (previousAnchor) {
      validAnchorElement(previousAnchor as HTMLAnchorElement);
    }

    const wrappedAnchor = getWrappedInTag(input, anchorNode, 'a');
    if (wrappedAnchor) {
      validAnchorElement(wrappedAnchor);
    }
  }

  // FIXME: b, i로 스타일링된 링크 텍스트 삭제시 href 업데이트 되지 않는 버그 있음
  export function deleteTransform(input: HTMLElement, ev: InputEvent) {
    const selection = Editor.getSelection();
    const { anchorNode, anchorOffset } = selection;

    let anchorElement: HTMLAnchorElement | null = null;
    let anchorHref: string = "";
    if (isText(anchorNode) && isHTML(anchorNode.parentNode, "a")) {
      anchorElement = anchorNode.parentNode;
      anchorHref = anchorNode.nodeValue!;
    } else if (
      ev.inputType === "deleteContentBackward" ||
      ev.inputType === "deleteWordBackward"
    ) {
      // backspace
      console.log("down backspace");
      if (
        isText(anchorNode) &&
        isHTML(anchorNode.previousSibling, "a") &&
        anchorOffset === 0
      ) {
        console.log("previous HTMLAnchorElement");
      }
    } else if (
      ev.inputType === "deleteContentForward" ||
      ev.inputType === "deleteWordForward"
    ) {
      // delete
      if (
        isText(anchorNode) &&
        isHTML(anchorNode.nextSibling, "a") &&
        anchorOffset === anchorNode.nodeValue!.length
      ) {
        anchorElement = anchorNode.nextSibling;
        anchorHref = anchorNode.nextSibling.textContent!;
      }
    }

    if (!anchorElement) return;

    if (RegexHttp.test(anchorHref)) {
      // new link
      anchorElement.href = anchorHref;
    } else {
      // not link
      const childNodes = [...anchorElement.childNodes];
      childNodes.forEach((child) => anchorElement!.removeChild(child));
      childNodes
        .reverse()
        .forEach((child) =>
          anchorElement!.parentNode!.insertBefore(child, anchorElement)
        );
      anchorElement!.parentNode!.removeChild(anchorElement!);

      Editor.focus(anchorNode, anchorOffset);
    }
  }

  const START_FRAGMENT = '<!--StartFragment-->';
  const END_FRAGMENT = '<!--EndFragment-->';
  
  const blockTags = ['DIV', 'P', 'SECTION', 'MAIN', 'ARTICLE', 'BR'];

  type PasteStackItem =
  | {
    type: 'text',
    node: Node;
    i: boolean;
    u: boolean;
    b: boolean;
    block: boolean;
    color: string;
  } 
  | {
    type: 'group',
    node: Node;
    i: boolean;
    u: boolean;
    b: boolean;
    block: boolean;
    color: string;
  };  

  function nodeToStackItem(node: Node, parentStackItem: Partial<PasteStackItem> = {}) {
    const block = blockTags.includes((node as HTMLElement).tagName);
  
    return {
      type: node.nodeType === 1 ? 'group' : 'text',
      node,
      i: parentStackItem.i ?? false,
      u: parentStackItem.u ?? false,
      b: parentStackItem.b ?? false,
      block,
      color: (node as HTMLElement).style?.color ?? (parentStackItem.color ?? ''),
    } as PasteStackItem;
  }

  export function pasteTransform(input: HTMLElement, ev: ClipboardEvent) {
    ev.preventDefault();
    const htmlData = ev.clipboardData!.getData('text/html');
    const startIndex = htmlData.indexOf(START_FRAGMENT) + START_FRAGMENT.length;
    const endIndex = htmlData.indexOf(END_FRAGMENT);
    const wrap = document.createElement('div');

    // FIXME: 최대 개수 제한 필요
    wrap.innerHTML = htmlData.slice(startIndex, endIndex);
  
    const stack: PasteStackItem[] = [...wrap.childNodes].map(node => nodeToStackItem(node));
    const result: PasteStackItem[][] = [[]];
    let target: PasteStackItem|undefined;
    
    console.log(wrap.innerHTML);

    while (target = stack.shift()) {
      const { node } = target;
      if (isText(node)) {
        result[result.length - 1].push(Object.assign(target, {style: ''}));
      } else if (blockTags.includes((node as HTMLElement).tagName ?? '') && ![...node.childNodes].length) {
        result.push([]);
      } else {
        if (target.block && result[result.length - 1].length) result.push([]);
        
        const items = [...node.childNodes].map(nodeChild => {
          return nodeToStackItem(nodeChild, target);
        });
        stack.unshift(...items);
      }
    }
    console.log(result);
  
    // let resultHTML = '';
    // for (const item of result) {
    //   const div = document.createElement('div');
    //   for (const { node, color } of item) {
    //     const span = Object.assign(document.createElement('span'), {});//, { style: `color: ${color}` });
    //     span.appendChild(node);
    //     div.appendChild(span);
    //   }
    //   resultHTML += div.outerHTML;
    // }
  }

  export function cleanEmpty(input: HTMLElement) {
    const selection = Editor.getSelection();
    const { anchorNode, anchorOffset } = selection;
    const paragraph = Parser.getCurrentParagraph(input, anchorNode);

    paragraph.childNodes.forEach(childNode => {
      if (childNode.nodeType === 1) {
        removeIfEmpty(input, childNode);
      } else if (isText(childNode)) {
        if (!childNode.data.length) childNode.remove();
      }
    })
  }

  export function deepSplitText(parent: Node, node: Node, offset: number) {
    const { node: targetText, offset: offsetText } = Parser.getDeepOffsetText(node, offset);

    const splitedText = (targetText as Text).splitText(offsetText);
    let target: Node = splitedText;

    let clonedParent: Node|null = null;
    // FIXME: splitedText.data가 없고 자식이 하나도 없으면 clonedParent를 생성하지 않아야 함
    while (target.parentNode !== parent) {
      // 부모 복제가 일어나면 이전 부모 append
      if (clonedParent) {
        const clone = target.parentNode!.cloneNode(false);
        clone.appendChild(clonedParent);
        clonedParent = clone;
      } else {
        clonedParent = target.parentNode!.cloneNode(false);
      }

      let targetSibling: Node|null = target.nextSibling;
      const currentParentNode = target.parentNode!;

      // 나누는 대상 텍스트는 clonedParent의 자식이 됨
      if (target === splitedText) clonedParent.appendChild(target);

      target = currentParentNode;
      
      // 나누는 대상 텍스트의 부모는 원본 텍스트를 위해 남겨두고 형제 노드만 clonedParent의 자식이 됨
      while (targetSibling) {
        clonedParent.appendChild(targetSibling);
        targetSibling = targetSibling.nextSibling;
      }

    }

    if (clonedParent) {
      insertAfter(clonedParent, target);
    }

    const result: Node[] = [];
    let targetSibling: Node|null = clonedParent ?? splitedText;
    while (targetSibling) {
      result.push(targetSibling);
      targetSibling = targetSibling.nextSibling;
    }

    if (!targetText.length) {
      const currentParent = targetText.parentNode!;
      targetText.remove();
      removeIfEmpty(parent, currentParent);
    }
    if (!splitedText.length) {
      const currentParent = targetText.parentNode!;
      splitedText.remove();
      removeIfEmpty(parent, currentParent);
      // if (result.includes(splitedText)) {
      //   result.splice(result.indexOf(splitedText), 1);
      // }
    }
    return result;
  }
}

export default Transform;
