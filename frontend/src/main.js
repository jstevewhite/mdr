import './style.css';
import './app.css';

import { GetAutoReload, GetFontScale, GetLaunchArgs, GetPalette, GetTheme, GetTOCPinned, GetTOCVisible, ListThemes, OpenAndRender, RenderFileWithPaletteAndTOC, SetAutoReload, SetFontScale, SetPalette, SetTheme, SetTOCPinned, SetTOCVisible, StartWatchingFile, StopWatchingFile } from '../wailsjs/go/main/App';
import { EventsOn } from '../wailsjs/runtime/runtime';

document.querySelector('#app').innerHTML = `
  <div class="shell">
    <header class="toolbar">
      <div class="brand">mdr</div>
      <div class="controls">
        <button id="tocToggle" class="btn" title="Toggle Table of Contents">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M0 2h16v2H0V2zm0 5h16v2H0V7zm0 5h16v2H0v-2z"/>
          </svg>
        </button>
        <div class="font">
          <button id="fontDec" class="btn" title="Decrease font size">A-</button>
          <div id="fontVal" class="fontVal">100%</div>
          <button id="fontInc" class="btn" title="Increase font size">A+</button>
        </div>
        <select id="theme" class="select">
          <option value="default">default</option>
        </select>
        <select id="palette" class="select">
          <option value="light">light</option>
          <option value="dark">dark</option>
          <option value="theme">theme</option>
        </select>
        <label class="auto-reload-label" title="Auto-reload file on changes">
          <input type="checkbox" id="autoReload" class="auto-reload-checkbox">
          Auto-reload
        </label>
        <button id="open" class="btn">Open…</button>
      </div>
      <div id="path" class="path"></div>
    </header>
    <main class="content">
      <aside id="tocSidebar" class="toc-sidebar">
        <div class="toc-header">
          <span>Table of Contents</span>
          <button id="tocPin" class="toc-pin-btn" title="Pin sidebar">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 9h8v1H4zm0-3h8v1H4zm0-3h8v1H4z"/>
            </svg>
          </button>
        </div>
        <nav id="tocNav" class="toc-nav"></nav>
      </aside>
      <iframe id="preview" class="preview"></iframe>
    </main>
    <footer class="status-bar">
      <div id="status" class="status">Ready</div>
    </footer>
  </div>
`;

const themeEl = document.getElementById('theme');
const paletteEl = document.getElementById('palette');
const openEl = document.getElementById('open');
const pathEl = document.getElementById('path');
const previewEl = document.getElementById('preview');
const statusEl = document.getElementById('status');
const fontDecEl = document.getElementById('fontDec');
const fontIncEl = document.getElementById('fontInc');
const fontValEl = document.getElementById('fontVal');
const autoReloadEl = document.getElementById('autoReload');
const tocToggleEl = document.getElementById('tocToggle');
const tocSidebarEl = document.getElementById('tocSidebar');
const tocNavEl = document.getElementById('tocNav');
const tocPinEl = document.getElementById('tocPin');
const statusBarEl = document.querySelector('.status-bar');
const statusTextEl = document.getElementById('status');

if (previewEl) {
  previewEl.setAttribute('sandbox', 'allow-same-origin');
  previewEl.setAttribute('referrerpolicy', 'no-referrer');
  previewEl.setAttribute('allow', '');
}

let currentPath = '';
let fontScale = 100;
let autoReloadEnabled = false;
let tocVisible = false;
let tocPinned = false;
let currentTOC = [];

function setControlsEnabled(enabled) {
  const disabled = !enabled;
  if (fontDecEl) fontDecEl.disabled = disabled;
  if (fontIncEl) fontIncEl.disabled = disabled;
  if (themeEl) themeEl.disabled = disabled;
  if (paletteEl) paletteEl.disabled = disabled;
  if (openEl) openEl.disabled = disabled;
}

function setStatus(level, msg) {
  const levelVal = level || 'info';
  const message = msg || '';
  if (statusBarEl) {
    statusBarEl.dataset.level = levelVal;
  }
  if (statusTextEl) {
    statusTextEl.textContent = message;
  }
}

function formatError(err) {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (err.message) return err.message;
  try {
    return JSON.stringify(err);
  } catch (_) {
    return String(err);
  }
}

function updateFontUI() {
  if (fontValEl) {
    fontValEl.textContent = `${fontScale}%`;
  }
}

function setPreview(html) {
  const doc = html || '<!DOCTYPE html><html><body></body></html>';

  previewEl.onload = () => {
    try {
      if (previewEl.contentWindow && previewEl.contentWindow.document) {
        previewEl.contentWindow.document.open();
        previewEl.contentWindow.document.write(doc);
        previewEl.contentWindow.document.close();
      }
    } catch (e) {
    }
  };

  previewEl.srcdoc = doc;
  setStatus('info', `Loaded ${doc.length} chars`);
}

function renderTOC(toc) {
  currentTOC = toc || [];

  if (!currentTOC.length) {
    tocNavEl.innerHTML = '<div class="toc-empty">No headings found</div>';
    return;
  }

  let html = '';
  for (const item of currentTOC) {
    const indent = (item.level - 1) * 16;
    html += `<a href="#${item.id}" class="toc-item toc-level-${item.level}" style="padding-left: ${indent}px" data-id="${item.id}">${item.text}</a>`;
  }

  tocNavEl.innerHTML = html;

  // Add click handlers for TOC items
  tocNavEl.querySelectorAll('.toc-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const id = item.dataset.id;
      // Send message to iframe to scroll to section
      try {
        const el = previewEl.contentWindow.document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } catch (err) {
        console.error('Failed to scroll to section:', err);
      }
    });
  });
}

async function toggleTOC() {
  tocVisible = !tocVisible;
  tocSidebarEl.classList.toggle('visible', tocVisible);

  // Save the TOC visibility state
  try {
    await SetTOCVisible(tocVisible);
  } catch (err) {
    console.error('Failed to save TOC visibility:', err);
  }
}

async function togglePin() {
  tocPinned = !tocPinned;
  tocSidebarEl.classList.toggle('pinned', tocPinned);

  // Save the TOC pinned state
  try {
    await SetTOCPinned(tocPinned);
  } catch (err) {
    console.error('Failed to save TOC pinned state:', err);
  }

  // Update preview margin
  if (tocPinned) {
    previewEl.style.marginLeft = '280px';
  } else {
    previewEl.style.marginLeft = '0';
  }

  // Update pin button icon
  if (tocPinned) {
    tocPinEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707l-4.95 4.95a.5.5 0 0 1-.707 0l-4.95-4.95a.5.5 0 0 1 0-.707l4.95-4.95a.5.5 0 0 1 .353-.146z"/>
    </svg>`;
    tocPinEl.title = 'Unpin sidebar';
  } else {
    tocPinEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4 9h8v1H4zm0-3h8v1H4zm0-3h8v1H4z"/>
    </svg>`;
    tocPinEl.title = 'Pin sidebar';
  }
}

function updateTOCTheme() {
  const palette = paletteEl.value;

  // Apply theme class based on current palette
  if (palette === 'dark') {
    tocSidebarEl.classList.add('dark-theme');
    tocSidebarEl.classList.remove('light-theme');
  } else if (palette === 'light') {
    tocSidebarEl.classList.add('light-theme');
    tocSidebarEl.classList.remove('dark-theme');
  } else {
    // 'theme' - use system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      tocSidebarEl.classList.add('dark-theme');
      tocSidebarEl.classList.remove('light-theme');
    } else {
      tocSidebarEl.classList.add('light-theme');
      tocSidebarEl.classList.remove('dark-theme');
    }
  }
}

async function openAndRender() {
  setStatus('info', '');
  try {
    const theme = themeEl.value;
    const palette = paletteEl.value;
    const res = await OpenAndRender(theme, palette);
    if (!res || !res.path) {
      return;
    }
    currentPath = res.path;
    pathEl.textContent = currentPath;
    requestAnimationFrame(() => {
      setPreview(res.html);
      renderTOC(res.toc);
      updateTOCTheme();
    });

    // Start watching the file if auto-reload is enabled
    if (autoReloadEnabled && currentPath) {
      try {
        await StartWatchingFile(currentPath);
      } catch (err) {
        console.error('Failed to start watching file:', err);
      }
    }
  } catch (err) {
    console.error(err);
    setStatus('error', formatError(err));
  }
}

async function rerender() {
  if (!currentPath) {
    return;
  }
  setStatus('info', '');
  try {
    const theme = themeEl.value;
    const palette = paletteEl.value;
    const res = await RenderFileWithPaletteAndTOC(currentPath, theme, palette);
    requestAnimationFrame(() => {
      setPreview(res.html);
      renderTOC(res.toc);
      updateTOCTheme();
    });
  } catch (err) {
    console.error(err);
    setStatus('error', formatError(err));
  }
}

openEl.addEventListener('click', openAndRender);

tocToggleEl.addEventListener('click', toggleTOC);

tocPinEl.addEventListener('click', (e) => {
  e.stopPropagation();
  togglePin();
});

fontDecEl.addEventListener('click', async () => {
  fontScale = Math.max(50, fontScale - 10);
  updateFontUI();
  try {
    await SetFontScale(fontScale);
  } catch (err) {
    console.error(err);
  }
  await rerender();
});

fontIncEl.addEventListener('click', async () => {
  fontScale = Math.min(200, fontScale + 10);
  updateFontUI();
  try {
    await SetFontScale(fontScale);
  } catch (err) {
    console.error(err);
  }
  await rerender();
});
themeEl.addEventListener('change', async () => {
  try {
    await SetTheme(themeEl.value);
  } catch (err) {
    console.error(err);
  }
  await rerender();
});

paletteEl.addEventListener('change', async () => {
  try {
    await SetPalette(paletteEl.value);
  } catch (err) {
    console.error(err);
  }
  updateTOCTheme();
  await rerender();
});

autoReloadEl.addEventListener('change', async () => {
  autoReloadEnabled = autoReloadEl.checked;

  // Save the auto-reload state
  try {
    await SetAutoReload(autoReloadEnabled);
  } catch (err) {
    console.error('Failed to save auto-reload setting:', err);
  }

  if (autoReloadEnabled && currentPath) {
    // Enable watching
    try {
      await StartWatchingFile(currentPath);
      setStatus('Auto-reload enabled');
    } catch (err) {
      console.error('Failed to start watching file:', err);
      setError('Failed to enable auto-reload: ' + err);
      autoReloadEl.checked = false;
      autoReloadEnabled = false;
    }
  } else {
    // Disable watching
    try {
      await StopWatchingFile();
      setStatus('Auto-reload disabled');
    } catch (err) {
      console.error('Failed to stop watching file:', err);
    }
  }
});

async function renderInitialArgs() {
  try {
    setControlsEnabled(false);
    try {
      const themes = await ListThemes();
      if (themes && themes.length) {
        themeEl.innerHTML = '';
        for (const t of themes) {
          const opt = document.createElement('option');
          opt.value = t;
          opt.textContent = t;
          themeEl.appendChild(opt);
        }
      }
    } catch (err) {
      console.error(err);
    }

    try {
      const savedTheme = await GetTheme();
      if (savedTheme) {
        themeEl.value = savedTheme;
      }
    } catch (err) {
      console.error(err);
    }

    try {
      const savedPalette = await GetPalette();
      if (savedPalette) {
        paletteEl.value = savedPalette;
      }
    } catch (err) {
      console.error(err);
    }

    try {
      const savedScale = await GetFontScale();
      if (savedScale) {
        fontScale = savedScale;
      }
      updateFontUI();
    } catch (err) {
      console.error(err);
      updateFontUI();
    }

    try {
      const savedAutoReload = await GetAutoReload();
      autoReloadEnabled = savedAutoReload;
      autoReloadEl.checked = savedAutoReload;
    } catch (err) {
      console.error(err);
    }

    try {
      const savedTOCVisible = await GetTOCVisible();
      tocVisible = savedTOCVisible;
      if (savedTOCVisible) {
        tocSidebarEl.classList.add('visible');
      }
    } catch (err) {
      console.error(err);
    }

    try {
      const savedTOCPinned = await GetTOCPinned();
      tocPinned = savedTOCPinned;
      if (savedTOCPinned) {
        tocSidebarEl.classList.add('pinned');
        previewEl.style.marginLeft = '280px';

        // Update pin button icon for pinned state
        tocPinEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707l-4.95 4.95a.5.5 0 0 1-.707 0l-4.95-4.95a.5.5 0 0 1 0-.707l4.95-4.95a.5.5 0 0 1 .353-.146z"/>
        </svg>`;
        tocPinEl.title = 'Unpin sidebar';
      }
    } catch (err) {
      console.error(err);
    }

    const args = await GetLaunchArgs();
    if (!args || args.length < 1) {
      return;
    }
    currentPath = args[0];
    pathEl.textContent = currentPath;

    setTimeout(async () => {
      await rerender();

      // Start watching if auto-reload is enabled
      if (autoReloadEnabled && currentPath) {
        try {
          await StartWatchingFile(currentPath);
        } catch (err) {
          console.error('Failed to start watching file:', err);
        }
      }
    }, 0);
  } catch (err) {
    console.error(err);
  } finally {
    setControlsEnabled(true);
  }
}

setPreview('');
updateFontUI();
setControlsEnabled(false);
renderInitialArgs();

EventsOn('file-open', async (paths) => {
  try {
    const p = Array.isArray(paths) ? paths[0] : paths;
    if (!p) {
      return;
    }
    currentPath = p;
    pathEl.textContent = currentPath;
    await rerender();

    if (autoReloadEnabled && currentPath) {
      try {
        await StartWatchingFile(currentPath);
      } catch (err) {
        console.error('Failed to start watching file:', err);
      }
    }
  } catch (err) {
    console.error(err);
  }
});

// Listen for file change events from the backend
EventsOn('file-changed', async (path) => {
  if (autoReloadEnabled && path === currentPath) {
    setStatus('info', 'File changed, reloading...');
    await rerender();
  }
});

// Listen for theme change events from the backend
EventsOn('theme-changed', async (themeName) => {
  if (autoReloadEnabled) {
    setStatus('info', `Theme changed (${themeName}), reloading...`);
    await rerender();
  }
});

// Listen for file watch errors
EventsOn('file-watch-error', (error) => {
  console.error('File watch error:', error);
  setStatus('error', 'File watch error: ' + formatError(error));
});

// Standardized status messages from backend
EventsOn('status', (payload) => {
  if (!payload) return;
  if (typeof payload === 'string') {
    setStatus('info', payload);
    return;
  }
  const level = payload.level || 'info';
  const msg = payload.message || '';
  setStatus(level, msg);
});
