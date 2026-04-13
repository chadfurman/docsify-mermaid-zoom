/**
 * docsify-mermaid-zoom
 *
 * Interactive mermaid diagrams for docsify — zoom, pan, resize, and fullscreen.
 *
 * Dependencies (load before this script):
 *   - mermaid (https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js)
 *   - docsify-mermaid (https://cdn.jsdelivr.net/npm/docsify-mermaid@2/dist/docsify-mermaid.js)
 *   - svg-pan-zoom (https://cdn.jsdelivr.net/npm/svg-pan-zoom@3.6.1/dist/svg-pan-zoom.min.js)
 *
 * Usage:
 *   <link rel="stylesheet" href="docsify-mermaid-zoom.css">
 *   <script src="docsify-mermaid-zoom.js"></script>
 *
 * Configuration (optional, via window.$docsify.mermaidZoom):
 *   - renderDelay: ms to wait after page render for mermaid to finish (default: 300)
 *   - minZoom: minimum zoom level (default: 0.1)
 *   - maxZoom: maximum zoom level (default: 10)
 *   - minHeight: minimum container height in px (default: 300)
 *   - maxHeight: maximum container height in px (default: 800)
 */
(function () {
  'use strict';

  var DEFAULTS = {
    renderDelay: 300,
    minZoom: 0.1,
    maxZoom: 10,
    minHeight: 300,
    maxHeight: 800
  };

  function getConfig() {
    var userConfig = (window.$docsify && window.$docsify.mermaidZoom) || {};
    return {
      renderDelay: userConfig.renderDelay || DEFAULTS.renderDelay,
      minZoom: userConfig.minZoom || DEFAULTS.minZoom,
      maxZoom: userConfig.maxZoom || DEFAULTS.maxZoom,
      minHeight: userConfig.minHeight || DEFAULTS.minHeight,
      maxHeight: userConfig.maxHeight || DEFAULTS.maxHeight
    };
  }

  function createButton(text, title, ariaLabel) {
    var btn = document.createElement('button');
    btn.textContent = text;
    btn.title = title;
    btn.setAttribute('aria-label', ariaLabel);
    return btn;
  }

  function initZoomContainers() {
    var config = getConfig();
    var diagrams = document.querySelectorAll('.mermaid');

    diagrams.forEach(function (el) {
      // Skip if already wrapped
      if (el.parentElement && el.parentElement.classList.contains('mermaid-zoom-container')) return;

      var svg = el.querySelector('svg');
      if (!svg) return;

      // Create the interactive container
      var container = document.createElement('div');
      container.className = 'mermaid-zoom-container';

      // Compute proportional height from SVG aspect ratio
      var bbox = svg.getBBox ? svg.getBBox() : null;
      var svgWidth = bbox ? bbox.width : 800;
      var svgHeight = bbox ? bbox.height : 400;
      var aspectRatio = svgHeight / svgWidth;
      var containerHeight = Math.min(
        Math.max(Math.round(aspectRatio * 900), config.minHeight),
        config.maxHeight
      );
      container.style.height = containerHeight + 'px';

      // Insert container and move diagram inside
      el.parentNode.insertBefore(container, el);
      container.appendChild(el);

      // Ensure SVG has a viewBox with padding
      if (!svg.getAttribute('viewBox') && bbox) {
        svg.setAttribute('viewBox',
          (bbox.x - 10) + ' ' + (bbox.y - 10) + ' ' +
          (bbox.width + 20) + ' ' + (bbox.height + 20));
      }

      // Remove inline styles so svg-pan-zoom can control sizing
      svg.removeAttribute('style');
      svg.style.width = '100%';
      svg.style.height = '100%';

      // Create controls
      var controls = document.createElement('div');
      controls.className = 'mermaid-zoom-controls';

      var zoomIn = createButton('+', 'Zoom in', 'Zoom in');
      var zoomOut = createButton('\u2212', 'Zoom out', 'Zoom out');
      var resetBtn = createButton('\u21BA', 'Reset view', 'Reset zoom');
      var fullscreenBtn = createButton('\u26F6', 'Fullscreen', 'Toggle fullscreen');
      fullscreenBtn.style.marginTop = '6px';

      controls.appendChild(zoomIn);
      controls.appendChild(zoomOut);
      controls.appendChild(resetBtn);
      controls.appendChild(fullscreenBtn);
      container.appendChild(controls);

      // Ensure clicking the diagram doesn't trap scroll/keyboard events
      container.addEventListener('click', function() {
        // Remove focus from the container so arrow keys scroll the page
        if (document.activeElement === container || container.contains(document.activeElement)) {
          container.blur();
        }
      });
      // Make sure the container doesn't capture tabindex
      container.setAttribute('tabindex', '-1');

      // Hint
      var hint = document.createElement('div');
      hint.className = 'mermaid-zoom-hint';
      hint.textContent = 'Pinch or Ctrl+scroll to zoom \u00B7 Drag to pan \u00B7 Resize from corner';
      container.appendChild(hint);

      // Initialize svg-pan-zoom
      try {
        var panZoom = svgPanZoom(svg, {
          zoomEnabled: true,
          panEnabled: true,
          controlIconsEnabled: false,
          mouseWheelZoomEnabled: false,
          preventMouseEventsDefault: true,
          zoomScaleSensitivity: 0.15,
          minZoom: config.minZoom,
          maxZoom: config.maxZoom,
          fit: true,
          center: true,
          contain: false
        });

        // Custom wheel handler: only zoom on pinch (ctrlKey) or Ctrl+scroll.
        // Regular two-finger scroll passes through to the page.
        container.addEventListener('wheel', function (e) {
          if (!e.ctrlKey) return; // let normal scroll bubble to page
          e.preventDefault();
          var direction = e.deltaY < 0 ? 1.05 : 0.95;
          panZoom.zoomBy(direction);
        }, { passive: false });

        // Force fit after layout settles
        setTimeout(function () {
          panZoom.resize();
          panZoom.fit();
          panZoom.center();
        }, 100);

        // Zoom controls
        zoomIn.addEventListener('click', function (e) {
          e.preventDefault();
          panZoom.zoomIn();
        });
        zoomOut.addEventListener('click', function (e) {
          e.preventDefault();
          panZoom.zoomOut();
        });
        resetBtn.addEventListener('click', function (e) {
          e.preventDefault();
          panZoom.resetZoom();
          panZoom.resetPan();
          panZoom.fit();
          panZoom.center();
        });

        // Fullscreen toggle
        var savedHeight = container.style.height;
        fullscreenBtn.addEventListener('click', function (e) {
          e.preventDefault();
          var isFullscreen = container.classList.toggle('fullscreen');
          fullscreenBtn.textContent = isFullscreen ? '\u2716' : '\u26F6';
          fullscreenBtn.title = isFullscreen ? 'Exit fullscreen' : 'Fullscreen';
          document.body.style.overflow = isFullscreen ? 'hidden' : '';
          if (!isFullscreen) container.style.height = savedHeight;
          setTimeout(function () {
            panZoom.resize();
            panZoom.fit();
            panZoom.center();
          }, 50);
        });

        // ESC to exit fullscreen
        document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape' && container.classList.contains('fullscreen')) {
            fullscreenBtn.click();
          }
        });

        // Refit on window resize and container resize (draggable corner)
        var resizeTimer;
        var resizeHandler = function () {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(function () {
            panZoom.resize();
            panZoom.fit();
            panZoom.center();
          }, 150);
        };
        window.addEventListener('resize', resizeHandler);
        if (window.ResizeObserver) {
          new ResizeObserver(resizeHandler).observe(container);
        }
      } catch (err) {
        console.warn('docsify-mermaid-zoom: svg-pan-zoom init failed:', err);
      }
    });
  }

  // Docsify plugin registration
  function mermaidZoomPlugin(hook) {
    hook.doneEach(function () {
      var config = getConfig();
      setTimeout(initZoomContainers, config.renderDelay);
    });
  }

  // Register
  if (!window.$docsify) window.$docsify = {};
  if (!window.$docsify.plugins) window.$docsify.plugins = [];
  window.$docsify.plugins.push(mermaidZoomPlugin);
})();
