import Transform from "./Transform";
import "./index.css";
import { getWrappedInTag, isHTML } from "./utils";

namespace WysiwygEditor {  
  function handleKeyDown(input: HTMLElement, ev: InputEvent) {
    if (ev.inputType === "insertParagraph") {
      Transform.cleanEmpty(input);
      Transform.enterTransform(input, ev);
    } else if (
      ev.inputType === "deleteContentBackward" ||
      ev.inputType === "deleteContentForward" ||
      ev.inputType === "deleteWordForward" ||
      ev.inputType === "deleteWordBackward"
    ) {
      Transform.deleteTransform(input, ev);
    } else {
      Transform.linkTransform(input, ev);
    }
    Transform.lastWrap(input);
  }
  function handleKeyUp(input: HTMLElement, ev: KeyboardEvent) {}

  // FIXME: click handler 주입식으로 변경
  function handleClick(input: HTMLElement, ev: MouseEvent) {
    const node = ev.target as Node;
    const a = isHTML(node, 'a') ? node : getWrappedInTag(input, node, 'a');

    if (a) {
      window.open(a.href, '_blank');
    }
  }

  function handlePaste(input: HTMLElement, ev: ClipboardEvent) {
    Transform.pasteTransform(input, ev);
  }

  function createHandleKeyDown(input: HTMLElement) {
    return handleKeyDown.bind(null, input);
  }

  function createHandleKeyUp(input: HTMLElement) {
    return handleKeyUp.bind(null, input);
  }

  function createHandlePaste(input: HTMLElement) {
    return handlePaste.bind(null, input);
  }
  function createHandleClick(input: HTMLElement) {
    return handleClick.bind(null, input);
  }


  export function create(input: HTMLElement) {
    input.className = "wysiwyg-editor";
    input.contentEditable = "true";

    input.addEventListener('click', createHandleClick(input));

    Transform.initWrap(input);

    const handleKeyDown = createHandleKeyDown(input);
    const handleKeyUp = createHandleKeyUp(input);
    const handlePaste = createHandlePaste(input);

    let isPaste = false;
    input.addEventListener("input", ev => {
      if (isPaste) return;
      handleKeyDown(ev as InputEvent);
    });
    input.addEventListener("keyup", handleKeyUp);
    input.addEventListener("paste", ev => {
      isPaste = true;
      handlePaste(ev);
      isPaste = false;
    });

    return function destory() {
      input.removeEventListener("input", handleKeyDown as any);
      input.removeEventListener("keyup", handleKeyUp);
      input.removeEventListener("paste", handlePaste);
    };
  }
}

export default WysiwygEditor;
