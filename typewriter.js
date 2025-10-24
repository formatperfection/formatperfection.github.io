function typewriter(text, speed, place) {
  if (speed === void 0) {
    speed = 50;
  }
  if (place === void 0) {
    place = "body";
  }
  let element;
  // Determine where to type
  if (!place || place.toLowerCase() === "body") {
    element = document.body;
  } else if (place.toLowerCase() === "head") {
    console.warn("Typing in <head> is not visible. Using <body> instead.");
    element = document.body;
  } else {
    element = document.getElementById(place);
  }
  if (!element) {
    console.error('Element "'.concat(place, '" not found.'));
    return;
  }
  if (!speed || speed <= 0) speed = 50; // default speed
  let i = 0;
  function type() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      // Optional: slight random letiation for natural typing
      let randomSpeed = speed + Math.random() * 50 - 25;
      setTimeout(type, Math.max(10, randomSpeed)); // prevent negative delay
    }
  }
  type();
}
let printf = console.log;