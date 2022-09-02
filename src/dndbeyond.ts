import API from "./api";
import { getStorage } from "./storage";

const RETRY_TIMEOUT = 100;

/**
 * Initialize listeners on all attacks
 */
function init() {
  const attackElements = document.querySelectorAll(
    ".integrated-dice__container"
  );

  if (attackElements.length === 0) return setTimeout(init, RETRY_TIMEOUT); // retry if missing

  attackElements.forEach((element) => {
    // Remove all existing event listeners
    const nextElement = element.cloneNode(true);
    // Add listener to send roll to dddice
    nextElement.addEventListener("pointerdown", onPointerDown);
    element.replaceWith(nextElement);
  });
}

/**
 * Pointer Down
 * Send roll event to dddice extension which will send to API
 */
function onPointerDown(e) {
  e.preventDefault();
  e.stopPropagation();

  const text = (this as HTMLDivElement).textContent;
  let modifier: number;
  let dieCount = 1;
  let dieType = "d20";

  if (/^\+\d/.test(text)) {
    modifier = Number(text.replace("+", ""));
  } else if (/^\-\d/.test(text)) {
    modifier = -1 * Number(text.replace("-", ""));
  } else if (/\d*d\d*/.test(text)) {
    const [count, type] = text.split("d");
    dieCount = Number(count);
    dieType = `d${type}`;
  }

  rollCreate(dieCount, dieType, modifier);
}

async function rollCreate(count: number, type: string, modifier: number) {
  const [apiKey, room, theme] = await Promise.all([
    getStorage("apiKey"),
    getStorage("room"),
    getStorage("theme"),
  ]);

  const dice = [];
  for (let i = 0; i < count; i++) {
    dice.push({
      type,
      theme,
    });
  }

  if (modifier) {
    dice.push({
      type: "mod",
      theme,
      value: modifier,
    });
  }

  new API(apiKey).roll().create(dice, room);
}

window.addEventListener("load", () => init());
window.addEventListener("resize", () => init());
