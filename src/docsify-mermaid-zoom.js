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
    maxHeight: 800,
    debug: false
  };

  function log() {
    if (getConfig().debug) {
      console.log.apply(console, ['[mermaid-zoom]'].concat(Array.prototype.slice.call(arguments)));
    }
  }

  function getConfig() {
    var userConfig = (window.$docsify && window.$docsify.mermaidZoom) || {};
    return {
      renderDelay: userConfig.renderDelay || DEFAULTS.renderDelay,
      minZoom: userConfig.minZoom || DEFAULTS.minZoom,
      maxZoom: userConfig.maxZoom || DEFAULTS.maxZoom,
      minHeight: userConfig.minHeight || DEFAULTS.minHeight,
      maxHeight: userConfig.maxHeight || DEFAULTS.maxHeight,
      debug: userConfig.debug || DEFAULTS.debug
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
    log('initZoomContainers called, found', diagrams.length, 'diagrams, config:', JSON.stringify(config));

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

      // Focus model: click diagram to focus it (scroll pans, arrows pan).
      // ESC or click outside to release. Fullscreen always focused.
      container.setAttribute('tabindex', '0');
      var focused = false;

      function setFocused(val) {
        focused = val;
        container.classList.toggle('focused', val);
        log('focus changed:', val);
      }

      container.addEventListener('click', function (e) {
        // Don't focus if clicking a control button
        if (e.target.closest && e.target.closest('.mermaid-zoom-controls')) return;
        if (!focused) {
          container.focus();
          setFocused(true);
          log('diagram focused via click');
        }
      });

      container.addEventListener('blur', function () {
        // Don't unfocus if in fullscreen
        if (!container.classList.contains('fullscreen')) {
          setFocused(false);
          log('diagram blurred');
        }
      });

      // Hint
      var hint = document.createElement('div');
      hint.className = 'mermaid-zoom-hint';
      hint.textContent = 'Click to interact \u00B7 Pinch to zoom \u00B7 ESC to release';
      container.appendChild(hint);

      // Initialize svg-pan-zoom
      try {
        log('initializing svg-pan-zoom');
        var panZoom = svgPanZoom(svg, {
          zoomEnabled: true,
          panEnabled: true,
          controlIconsEnabled: false,
          mouseWheelZoomEnabled: false,
          preventMouseEventsDefault: false,
          zoomScaleSensitivity: 0.15,
          minZoom: config.minZoom,
          maxZoom: config.maxZoom,
          fit: true,
          center: true,
          contain: false
        });

        // Wheel handler:
        // - Pinch (ctrlKey): zoom
        // - Focused: pan the diagram
        // - Not focused: scroll the page
        var PAN_SPEED = 3;
        container.addEventListener('wheel', function (e) {
          // Pinch-to-zoom (ctrlKey) always works regardless of focus
          if (e.ctrlKey) {
            e.preventDefault();
            var direction = e.deltaY < 0 ? 1.05 : 0.95;
            log('pinch zoom by', direction);
            panZoom.zoomBy(direction);
            return;
          }
          // When focused: scroll pans the diagram
          if (focused || container.classList.contains('fullscreen')) {
            e.preventDefault();
            panZoom.panBy({ x: -e.deltaX * PAN_SPEED, y: -e.deltaY * PAN_SPEED });
            log('pan by', -e.deltaX * PAN_SPEED, -e.deltaY * PAN_SPEED);
            return;
          }
          // Not focused: let scroll bubble to page
          log('not focused, scroll passes through');
        }, { passive: false });

        // Arrow keys pan the diagram when focused
        container.addEventListener('keydown', function (e) {
          var PAN_STEP = 40;
          // ESC: unfocus (or exit fullscreen)
          if (e.key === 'Escape') {
            if (container.classList.contains('fullscreen')) {
              fullscreenBtn.click();
            } else {
              container.blur();
              setFocused(false);
            }
            e.preventDefault();
            return;
          }
          // Arrow keys only when focused
          if (!focused && !container.classList.contains('fullscreen')) return;
          var handled = true;
          switch (e.key) {
            case 'ArrowUp':    panZoom.panBy({ x: 0, y: PAN_STEP }); break;
            case 'ArrowDown':  panZoom.panBy({ x: 0, y: -PAN_STEP }); break;
            case 'ArrowLeft':  panZoom.panBy({ x: PAN_STEP, y: 0 }); break;
            case 'ArrowRight': panZoom.panBy({ x: -PAN_STEP, y: 0 }); break;
            default: handled = false;
          }
          if (handled) {
            e.preventDefault();
            log('arrow pan:', e.key);
          }
        });

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
          if (isFullscreen) {
            container.focus();
            setFocused(true);
          } else {
            container.style.height = savedHeight;
            setFocused(false);
          }
          setTimeout(function () {
            panZoom.resize();
            panZoom.fit();
            panZoom.center();
          }, 50);
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
