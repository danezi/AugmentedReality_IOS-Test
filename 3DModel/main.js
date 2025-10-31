// main.js

// Wir holen das Model-Viewer-Element
const modelViewer = document.getElementById("arModel");

// Rotation per Button aktivieren/deaktivieren
const rotateBtn = document.getElementById("rotateBtn");

rotateBtn.addEventListener("click", () => {
  const isRotating = modelViewer.hasAttribute("auto-rotate");

  if (isRotating) {
    modelViewer.removeAttribute("auto-rotate");
    rotateBtn.textContent = "Rotation einschalten";
  } else {
    modelViewer.setAttribute("auto-rotate", "");
    rotateBtn.textContent = "Rotation ausschalten";
  }
});

// Debug-Events (optional)
modelViewer.addEventListener("load", () => {
  console.log("✅ Modell geladen:", modelViewer.src);
});

modelViewer.addEventListener("ar-status", (event) => {
  console.log("📱 AR-Status:", event.detail.status);
});
