export function createStyledElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  styles: Partial<CSSStyleDeclaration>,
  textContent?: string
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  Object.assign(element.style, styles);

  if (textContent) {
    element.textContent = textContent;
  }

  return element;
} 