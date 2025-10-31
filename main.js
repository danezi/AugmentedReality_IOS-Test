// main.js
window.addEventListener("load", () => {
  const model = document.getElementById("hafenModel");

  model.addEventListener("model-loaded", () => {
    console.log("✅ neuerHafen.glb erfolgreich geladen!");
  });

  model.addEventListener("arjs-nft-loaded", () => {
    console.log("📱 AR.js Tracking bereit.");
  });
});
