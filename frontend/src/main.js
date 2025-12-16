import './style.css';
import './app.css';

import { GetFontScale, GetLaunchArgs, GetPalette, GetTheme, ListThemes, OpenAndRender, RenderFileWithPalette, SetFontScale, SetPalette, SetTheme } from '../wailsjs/go/main/App';

document.querySelector('#app').innerHTML = `
  <div class="shell">
    <header class="toolbar">
      <div class="brand">mdr</div>
      <div class="controls">
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
        <button id="open" class="btn">Open…</button>
      </div>
      <div id="path" class="path"></div>
    </header>
    <main class="content">
      <iframe id="preview" class="preview"></iframe>
      <div id="status" class="status"></div>
    </main>
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

let currentPath = '';
let fontScale = 100;

function setControlsEnabled(enabled) {
  const disabled = !enabled;
  if (fontDecEl) fontDecEl.disabled = disabled;
  if (fontIncEl) fontIncEl.disabled = disabled;
  if (themeEl) themeEl.disabled = disabled;
  if (paletteEl) paletteEl.disabled = disabled;
  if (openEl) openEl.disabled = disabled;
}

function updateFontUI() {
  if (fontValEl) {
    fontValEl.textContent = `${fontScale}%`;
  }
}

function setStatus(msg) {
  statusEl.dataset.level = 'info';
  statusEl.textContent = msg || '';
}

function setError(err) {
  statusEl.dataset.level = 'error';
  statusEl.textContent = err ? String(err) : '';
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
  setStatus(`Loaded ${doc.length} chars`);
}

async function openAndRender() {
  setStatus('');
  try {
    const theme = themeEl.value;
    const palette = paletteEl.value;
    const res = await OpenAndRender(theme, palette);
    if (!res || !res.path) {
      return;
    }
    currentPath = res.path;
    pathEl.textContent = currentPath;
    requestAnimationFrame(() => setPreview(res.html));
  } catch (err) {
    console.error(err);
    setError(err);
  }
}

async function rerender() {
  if (!currentPath) {
    return;
  }
  setStatus('');
  try {
    const theme = themeEl.value;
    const palette = paletteEl.value;
    const html = await RenderFileWithPalette(currentPath, theme, palette);
    requestAnimationFrame(() => setPreview(html));
  } catch (err) {
    console.error(err);
    setError(err);
  }
}

openEl.addEventListener('click', openAndRender);

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
  await rerender();
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

    const args = await GetLaunchArgs();
    if (!args || args.length < 1) {
      return;
    }
    currentPath = args[0];
    pathEl.textContent = currentPath;

    setTimeout(() => {
      rerender();
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
