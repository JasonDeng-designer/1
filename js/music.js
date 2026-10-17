/**
 * Site background music: autoplay on enter + top-right close control.
 * Track: Mixkit "Valley Sunset" (royalty-free Mixkit License).
 * src is document-relative so GitHub Pages project base /1/ resolves
 * to /1/audio/ambient-bg.mp3 from every root HTML page.
 */
(function () {
  "use strict";

  if (document.getElementById("bg-music-toggle")) return;

  var audio = document.createElement("audio");
  audio.id = "bg-music";
  audio.src = "audio/ambient-bg.mp3";
  audio.loop = true;
  audio.preload = "auto";
  audio.setAttribute("playsinline", "");
  audio.volume = 0.45;

  var btn = document.createElement("button");
  btn.id = "bg-music-toggle";
  btn.type = "button";
  btn.className = "bg-music-toggle";
  btn.setAttribute("aria-label", "Close music");
  btn.setAttribute("aria-pressed", "false");
  btn.innerHTML =
    '<span class="bg-music-toggle__icon" aria-hidden="true">♪</span>' +
    '<span class="bg-music-toggle__label">Sound off</span>';

  document.body.appendChild(audio);

  var header = document.querySelector(".site-header");
  if (header) {
    header.appendChild(btn);
  } else {
    document.body.appendChild(btn);
  }

  var playing = false;
  var closed = false;

  function setUi(on) {
    playing = on;
    btn.classList.toggle("is-playing", on);
    btn.classList.toggle("is-off", !on);
    btn.setAttribute("aria-pressed", on ? "false" : "true");
    btn.querySelector(".bg-music-toggle__label").textContent = on
      ? "Sound off"
      : "Sound on";
    btn.setAttribute("aria-label", on ? "Close music" : "Play music");
  }

  function tryPlay() {
    if (closed) return;
    var p = audio.play();
    if (p && typeof p.then === "function") {
      p.then(function () {
        setUi(true);
      }).catch(function () {
        setUi(false);
      });
    } else {
      setUi(!audio.paused);
    }
  }

  function stopMusic() {
    audio.pause();
    audio.currentTime = 0;
    setUi(false);
  }

  btn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (playing) {
      closed = true;
      stopMusic();
    } else {
      closed = false;
      tryPlay();
    }
  });

  tryPlay();

  function unlock(e) {
    if (closed || playing) return;
    // The same gesture also clicks this control. Let the button handler
    // start playback; otherwise pointerdown starts it and click stops it.
    if (e && e.target && btn.contains(e.target)) return;
    tryPlay();
  }
  ["pointerdown", "keydown", "touchstart"].forEach(function (evt) {
    document.addEventListener(evt, unlock, { once: true, passive: true });
  });
})();
