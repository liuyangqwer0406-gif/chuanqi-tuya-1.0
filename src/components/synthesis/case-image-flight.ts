export function containedImageBounds(image: HTMLImageElement) {
  const box = image.getBoundingClientRect();
  if (!image.naturalWidth) return box;
  const scale = Math.min(box.width / image.naturalWidth, box.height / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  return new DOMRect(box.x + (box.width - width) / 2, box.y + (box.height - height) / 2, width, height);
}

export function animateImageFlight(image: HTMLImageElement, from: DOMRect, to: DOMRect) {
  const clone = new Image();
  clone.src = image.currentSrc || image.src;
  clone.alt = "";
  clone.dataset.caseFlight = "true";
  clone.setAttribute("aria-hidden", "true");
  Object.assign(clone.style, {
    position: "fixed", zIndex: "150", pointerEvents: "none", objectFit: "contain",
    left: `${to.x}px`, top: `${to.y}px`, width: `${to.width}px`, height: `${to.height}px`,
    maxWidth: "none", transformOrigin: "top left",
  });
  document.body.append(clone);
  const visibility = image.style.visibility;
  image.style.visibility = "hidden";
  const animation = clone.animate([
    { transform: `translate(${from.x - to.x}px, ${from.y - to.y}px) scale(${from.width / to.width}, ${from.height / to.height})` },
    { transform: "none" },
  ], { duration: 440, easing: "cubic-bezier(.22,1,.36,1)" });
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    animation.cancel();
    clone.remove();
    image.style.visibility = visibility;
  };
  void animation.finished.then(cleanup, cleanup);
  return cleanup;
}
