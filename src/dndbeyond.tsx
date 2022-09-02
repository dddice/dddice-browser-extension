import API from "./api";
import { getStorage } from "./storage";

import "./index.css";
import "./dndbeyond.css";
import imageLogo from 'url:./assets/dddice-32x32.png'

const RETRY_TIMEOUT = 100;

/**
 * Initialize listeners on all attacks
 */
function init() {
  const diceElements = document.querySelectorAll(".integrated-dice__container");

  if (diceElements.length === 0) return setTimeout(init, RETRY_TIMEOUT); // retry if missing

  diceElements.forEach((element) => {
    // Add listener to send roll to dddice
    element.addEventListener("pointerover", onPointerOver, true);
    element.addEventListener("pointerout", onPointerOut, true);
  });
}

function onPointerOver(e) {
  if (!this.id) {
    this.id = Date.now().toString(36)
  }

  const { top, right } = this.getBoundingClientRect()

  const overlayId = `ddd-${this.id}`
  const overlayElement = document.getElementById(overlayId)
  if (!overlayElement) {
    const text = (this as HTMLDivElement).textContent;

    const img = document.createElement('img')
    img.src = imageLogo;
    img.className = 'h-auto w-auto'

    const buttonRoll = document.createElement('button')
    buttonRoll.addEventListener('pointerup', onPointerUp())
    buttonRoll.appendChild(img)
    buttonRoll.className = "h-10 w-10 bg-gray-900 rounded-l flex items-center justify-center p-1 hover:bg-gray-700 transition-colors duration-100"
    buttonRoll.dataset.text = text

    const buttonAdv = document.createElement('button')
    buttonAdv.addEventListener('pointerup', onPointerUp({ k: 'h1' }))
    buttonAdv.className = "flex-1 h-10 flex items-center justify-center uppercase bg-gray-900 p-1 hover:bg-gray-700 transition-colors duration-100 text-gray-100 font-bold"
    buttonAdv.textContent = 'adv'
    buttonAdv.dataset.text = text

    const buttonDis = document.createElement('button')
    buttonDis.addEventListener('pointerup', onPointerUp({ k: 'l1' }))
    buttonDis.className = "flex-1 h-10 flex items-center justify-center uppercase bg-gray-900 rounded-r p-1 hover:bg-gray-700 transition-colors duration-100 text-gray-100 font-bold"
    buttonDis.textContent = 'dis'
    buttonDis.dataset.text = text

    const node = document.createElement("div");
    node.id = overlayId
    node.className = "fixed z-10 top-0 left-0 flex items-center justify-center text-sm rounded";
    node.style.marginTop = `${top}px`
    node.style.marginLeft = `${right}px`

    node.appendChild(buttonRoll)
    node.appendChild(buttonAdv)
    node.appendChild(buttonDis)
    document.body.appendChild(node);
  } else {
    overlayElement.style.display = 'flex'
  }
}

function onPointerOut(e) {
  const closeOverlay = () => {
    const overlayElement = document.getElementById(`ddd-${this.id}`)
    if (overlayElement.querySelector(':hover') === null) {
      overlayElement.style.display = 'none'
    } else {
      this.timeout = setTimeout(closeOverlay, 250)
    }
  }
  this.timeout = setTimeout(closeOverlay, 250)
}

/**
 * Pointer Up
 * Send roll event to dddice extension which will send to API
 */
function onPointerUp(operator = {}) {
  return function(e) {
    if (e.button === 2) return;

    e.preventDefault();
    e.stopPropagation();

    const text = (this as HTMLDivElement).dataset.text;
    let modifier: number;
    let dieCount = Object.keys(operator).length === 0 ? 1 : 2;
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

    rollCreate(dieCount, dieType, modifier, operator);
  }
}

async function rollCreate(count: number, type: string, modifier: number, operator = {}) {
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

  const api = new API(apiKey);

  await api.room().updateRolls(room, { is_cleared: true });
  await api.roll().create({ dice, room, operator });
}

window.addEventListener("load", () => init());
window.addEventListener("resize", () => init());
