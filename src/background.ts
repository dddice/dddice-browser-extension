const RETRY_TIMEOUT = 100;

/**
 * Initialize listeners on all attacks
 */
function init() {
  const attackElements = document.querySelectorAll(
    ".ddbc-combat-attack__action"
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
function onPointerDown() {
  chrome.runtime.sendMessage({
    type: "d20",
    modifier: (this as HTMLDivElement).textContent,
  });
}

/**
 * Remove the canvas from D&DBeyond to prevent 3D dice from appearing
 */
// function removeCanvas() {
//   const canvas = document.getElementById("dice-rolling-canvas");
//   if (!canvas) return setTimeout(removeCanvas, RETRY_TIMEOUT); // retry if missing
//
//   const engine = canvas.dataset.engine;
//   if (!engine) return setTimeout(removeCanvas, RETRY_TIMEOUT); // retry if not initialized
//
//   canvas.parentNode.removeChild(canvas);
// }

/**
 * On page load, remove the canvas right away
 */
window.addEventListener("load", () => {
  init();
});
