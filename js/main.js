/**
 * Jason Deng portfolio — cinematic stage parallax / tilt (no WebGL)
 */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var stage = document.querySelector(".stage");
  var tiles = document.querySelectorAll(".tile[data-depth]");

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  /* —— Home stage: mouse parallax + preserve base CSS 3D —— */
  if (stage && tiles.length && !reduceMotion) {
    var targetX = 0;
    var targetY = 0;
    var curX = 0;
    var curY = 0;
    var raf = null;

    tiles.forEach(function (tile) {
      tile._baseTransform = window.getComputedStyle(tile).transform;
      if (!tile._baseTransform || tile._baseTransform === "none") {
        tile._baseTransform = "";
      }
      tile._depth = parseFloat(tile.getAttribute("data-depth")) || 0.4;
    });

    function onMove(e) {
      var rect = stage.getBoundingClientRect();
      var nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      var ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      targetX = clamp(nx, -1, 1);
      targetY = clamp(ny, -1, 1);
      if (!raf) raf = requestAnimationFrame(tick);
    }

    function onLeave() {
      targetX = 0;
      targetY = 0;
      stage.classList.remove("is-hovering");
      if (!raf) raf = requestAnimationFrame(tick);
    }

    function tick() {
      curX += (targetX - curX) * 0.1;
      curY += (targetY - curY) * 0.1;

      tiles.forEach(function (tile) {
        var d = tile._depth;
        var tx = curX * -48 * d;
        var ty = curY * -32 * d;
        var ry = curX * 7 * d;
        var rx = curY * -5.5 * d;
        var hoverScale = tile.matches(":hover") ? 1.045 : 1;
        tile.style.transform =
          tile._baseTransform +
          " translate3d(" +
          tx.toFixed(2) +
          "px," +
          ty.toFixed(2) +
          "px,0) rotateX(" +
          rx.toFixed(2) +
          "deg) rotateY(" +
          ry.toFixed(2) +
          "deg) scale(" +
          hoverScale +
          ")";
      });

      if (Math.abs(targetX - curX) > 0.001 || Math.abs(targetY - curY) > 0.001) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    }

    stage.addEventListener("mousemove", onMove, { passive: true });
    stage.addEventListener("mouseleave", onLeave);

    tiles.forEach(function (tile) {
      tile.addEventListener("mouseenter", function () {
        stage.classList.add("is-hovering");
        if (!raf) raf = requestAnimationFrame(tick);
      });
      tile.addEventListener("mouseleave", function () {
        if (!stage.querySelector(".tile:hover")) {
          stage.classList.remove("is-hovering");
        }
        if (!raf) raf = requestAnimationFrame(tick);
      });
    });
  }

  /* —— Soft entrance for tiles —— */
  if (tiles.length && !reduceMotion) {
    tiles.forEach(function (tile, i) {
      tile.style.opacity = "0";
      tile.style.transition =
        "opacity 1.05s cubic-bezier(0.22,1,0.36,1) " + i * 0.08 + "s";
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          tile.style.opacity = "";
        });
      });
    });
  }

  /* —— Project list: slight thumb follow —— */
  var rows = document.querySelectorAll(".project-row");
  if (rows.length && !reduceMotion) {
    rows.forEach(function (row) {
      var thumb = row.querySelector(".project-thumb");
      if (!thumb) return;
      row.addEventListener(
        "mousemove",
        function (e) {
          var r = row.getBoundingClientRect();
          var nx = ((e.clientX - r.left) / r.width) * 2 - 1;
          thumb.style.transform =
            "perspective(600px) rotateY(" + (-8 + nx * 6).toFixed(1) + "deg)";
        },
        { passive: true }
      );
      row.addEventListener("mouseleave", function () {
        thumb.style.transform = "";
      });
    });
  }

  /* —— Lookbook: reveal frames on scroll —— */
  var frames = document.querySelectorAll(".frame");
  if (frames.length && "IntersectionObserver" in window && !reduceMotion) {
    frames.forEach(function (f) {
      f.style.opacity = "0";
      f.style.transform = "translateY(24px)";
      f.style.transition =
        "opacity 0.85s cubic-bezier(0.22,1,0.36,1), transform 0.85s cubic-bezier(0.22,1,0.36,1)";
    });
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    frames.forEach(function (f) {
      io.observe(f);
    });
  }

  /* —— Custom cursor (Gatt-like lag ring + dot) —— */
  (function initCursor() {
    var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine || reduceMotion) return;

    var dot = document.createElement("div");
    var ring = document.createElement("div");
    dot.className = "cursor-dot";
    ring.className = "cursor-ring";
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.body.classList.add("has-cursor");

    var mx = window.innerWidth / 2;
    var my = window.innerHeight / 2;
    var rx = mx;
    var ry = my;
    var hovering = false;
    var down = false;
    var running = false;

    function setHover(on) {
      hovering = on;
      dot.classList.toggle("is-hover", on);
      ring.classList.toggle("is-hover", on);
    }

    function onMove(e) {
      mx = e.clientX;
      my = e.clientY;
      if (!running) {
        running = true;
        requestAnimationFrame(tick);
      }
    }

    function tick() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      dot.style.transform = "translate3d(" + mx + "px," + my + "px,0) translate(-50%,-50%)";
      ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0) translate(-50%,-50%)";
      if (Math.abs(mx - rx) > 0.1 || Math.abs(my - ry) > 0.1) {
        requestAnimationFrame(tick);
      } else {
        running = false;
      }
    }

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mousedown", function () {
      down = true;
      ring.classList.add("is-down");
    });
    document.addEventListener("mouseup", function () {
      down = false;
      ring.classList.remove("is-down");
    });
    document.addEventListener(
      "mouseover",
      function (e) {
        var el = e.target.closest("a, button, .tile, .project-row, .frame img, .project-thumb");
        setHover(!!el);
      },
      true
    );
  
  /* —— Low-opacity background collage of works —— */
  (function initBgCollage() {
    if (document.querySelector(".bg-collage")) return;
    var srcs = [
      "images/conflux-orbit.jpg",
      "images/error-matrix.jpg",
      "images/resonant-marks-look.jpg",
      "images/cyberpanorama-prison.jpg",
      "images/new-human.jpg",
      "images/color-and-texture.jpg",
      "images/curious-find.jpg",
      "images/artist-film-muse.jpg",
      "images/conflux-orbit-alt.jpg",
      "images/conflux-orbit/look-01.jpg",
      "images/conflux-orbit/look-04.jpg",
      "images/conflux-orbit/hero.jpg"
    ];
    var wrap = document.createElement("div");
    wrap.className = "bg-collage";
    wrap.setAttribute("aria-hidden", "true");
    srcs.forEach(function (src, i) {
      var img = document.createElement("img");
      img.src = src;
      img.alt = "";
      img.className = "c" + (i + 1);
      wrap.appendChild(img);
    });
    document.body.insertBefore(wrap, document.body.firstChild);
  })();

})();

})();
