import './style.css';
import './app.css';

import { GetAutoReload, GetFontScale, GetLaunchArgs, GetPalette, GetTheme, GetTOCPinned, GetTOCVisible, ListThemes, OpenAndRender, RenderFileWithPaletteAndTOC, SetAutoReload, SetFontScale, SetPalette, SetTheme, SetTOCPinned, SetTOCVisible, StartWatchingFile, StopWatchingFile, SearchDocument, NavigateSearch, ClearSearch, GetSearchCaseSensitive, SetSearchCaseSensitive } from '../wailsjs/go/main/App';
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
  
  <!-- Search Interface -->
  <div id="searchBar" class="search-bar" style="display: none;">
    <div class="search-controls">
      <input type="text" id="searchInput" class="search-input" placeholder="Search in document... (/)">
      <div class="search-info">
        <span id="searchResults" class="search-results"></span>
      </div>
      <div class="search-buttons">
        <button id="searchPrev" class="search-btn" title="Previous match (Shift+F3)">↑</button>
        <button id="searchNext" class="search-btn" title="Next match (F3)">↓</button>
        <label class="search-case-label" title="Case sensitive (Ctrl+Shift+F)">
          <input type="checkbox" id="searchCaseSensitive" class="search-case-checkbox">
          Aa
        </label>
        <button id="searchClose" class="search-close-btn" title="Close (Esc)">✕</button>
      </div>
    </div>
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

// Search elements
const searchBarEl = document.getElementById('searchBar');
const searchInputEl = document.getElementById('searchInput');
const searchResultsEl = document.getElementById('searchResults');
const searchPrevEl = document.getElementById('searchPrev');
const searchNextEl = document.getElementById('searchNext');
const searchCloseEl = document.getElementById('searchClose');
const searchCaseSensitiveEl = document.getElementById('searchCaseSensitive');

// Keyboard shortcuts setup
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const modifierKey = isMac ? 'metaKey' : 'ctrlKey';

if (previewEl) {
  // Mermaid (and any other client-side enhancements) require scripts to run inside the preview.
  // Keep the iframe sandboxed, but allow scripts so Mermaid can render.
  previewEl.setAttribute('sandbox', 'allow-same-origin allow-scripts');
  previewEl.setAttribute('referrerpolicy', 'no-referrer');
  previewEl.setAttribute('allow', '');
}

let currentPath = '';
let fontScale = 100;
let autoReloadEnabled = false;
let tocVisible = false;
let tocPinned = false;
let currentTOC = [];

// Search state
let searchOpen = false;
let currentSearchResults = [];
let currentSearchIndex = -1;
let searchDebounceTimer = null;

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

// Search functionality
function openSearch() {
  searchOpen = true;
  searchBarEl.style.display = 'block';
  searchInputEl.focus();
  searchInputEl.select();
  setStatus('info', 'Search opened');
}

function closeSearch() {
  searchOpen = false;
  searchBarEl.style.display = 'none';
  searchInputEl.value = '';
  searchResultsEl.textContent = '';
  currentSearchResults = [];
  currentSearchIndex = -1;
  clearSearchHighlights();
  setStatus('info', 'Search closed');
}

function clearSearchHighlights() {
  // Clear highlights in the preview iframe
  try {
    const iframeDoc = previewEl.contentWindow.document;
    const highlights = iframeDoc.querySelectorAll('.search-highlight, .search-highlight-current');
    highlights.forEach(highlight => {
      const parent = highlight.parentNode;
      while (highlight.firstChild) {
        parent.insertBefore(highlight.firstChild, highlight);
      }
      parent.removeChild(highlight);
    });
  } catch (err) {
    console.error('Failed to clear search highlights:', err);
  }
}

function performSearch(query) {
  if (!query || !currentPath) {
    clearSearchHighlights();
    searchResultsEl.textContent = '';
    currentSearchResults = [];
    currentSearchIndex = -1;
    return;
  }

  // Debounce search to improve performance
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(async () => {
    try {
      const caseSensitive = searchCaseSensitiveEl.checked;
      const result = await SearchDocument(query, caseSensitive);
      
      currentSearchResults = result.matches || [];
      currentSearchIndex = result.currentIndex || 0;
      
      if (currentSearchResults.length === 0) {
        searchResultsEl.textContent = 'No matches';
        clearSearchHighlights();
      } else {
        searchResultsEl.textContent = `${currentSearchIndex + 1} of ${currentSearchResults.length}`;
        highlightSearchResults(); // Initial search - create all highlights
      }
    } catch (err) {
      console.error('Search error:', err);
      searchResultsEl.textContent = 'Search failed';
      clearSearchHighlights();
    }
  }, 300); // 300ms debounce
}

function highlightSearchResults() {
  if (currentSearchResults.length === 0) return;
  
  try {
    const iframeDoc = previewEl.contentWindow.document;
    clearSearchHighlights();
    
    // Get the current search query and create highlight elements
    const query = searchInputEl.value;
    if (!query) return;
    
    // Create regex pattern for case-sensitive or case-insensitive search
    const flags = searchCaseSensitiveEl.checked ? 'g' : 'gi';
    const pattern = new RegExp(escapeRegExp(query), flags);
    
    // Function to highlight text in an element
    function highlightElement(element) {
      if (element.nodeType === Node.TEXT_NODE) {
        const text = element.textContent;
        if (!pattern.test(text)) return;
        
        pattern.lastIndex = 0; // Reset regex state
        const matches = [];
        let match;
        while ((match = pattern.exec(text)) !== null) {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
            text: match[0]
          });
        }
        
        if (matches.length === 0) return;
        
        // Create a document fragment to hold the new content
        const fragment = iframeDoc.createDocumentFragment();
        let lastIndex = 0;
        
        matches.forEach((match, index) => {
          // Add text before match
          if (match.start > lastIndex) {
            fragment.appendChild(iframeDoc.createTextNode(text.slice(lastIndex, match.start)));
          }
          
          // Add highlighted match
          const mark = iframeDoc.createElement('mark');
          mark.className = 'search-highlight';
          if (index === currentSearchIndex) {
            mark.classList.add('search-highlight-current');
          }
          mark.textContent = match.text;
          fragment.appendChild(mark);
          
          lastIndex = match.end;
        });
        
        // Add remaining text
        if (lastIndex < text.length) {
          fragment.appendChild(iframeDoc.createTextNode(text.slice(lastIndex)));
        }
        
        // Replace the text node with the fragment
        element.parentNode.replaceChild(fragment, element);
      } else if (element.nodeType === Node.ELEMENT_NODE) {
        // Skip certain elements that shouldn't be highlighted
        const tagName = element.tagName.toLowerCase();
        if (['script', 'style', 'pre', 'code'].includes(tagName)) return;
        
        // Process child nodes
        const childNodes = Array.from(element.childNodes);
        childNodes.forEach(child => highlightElement(child));
      }
    }
    
    // Start highlighting from the body element
    highlightElement(iframeDoc.body);
    
    // Scroll to current match with delay to ensure DOM is updated
    if (currentSearchIndex >= 0 && currentSearchIndex < currentSearchResults.length) {
      const currentMatch = currentSearchResults[currentSearchIndex];
      // Use setTimeout to ensure DOM is updated before scrolling
      setTimeout(() => {
        const currentHighlight = iframeDoc.querySelector('.search-highlight-current');
        if (currentHighlight) {
          currentHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50); // 50ms delay
    }
  } catch (err) {
    console.error('Failed to highlight search results:', err);
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function navigateSearch(direction) {
  if (currentSearchResults.length === 0) return;
  
  try {
    // Call backend to update search state
    const result = await NavigateSearch(direction);
    currentSearchIndex = result.currentIndex;
  } catch (err) {
    console.error('Failed to navigate search:', err);
    // Fallback to local navigation
    if (direction === 'next') {
      currentSearchIndex++;
      if (currentSearchIndex >= currentSearchResults.length) {
        currentSearchIndex = 0;
      }
    } else if (direction === 'prev') {
      currentSearchIndex--;
      if (currentSearchIndex < 0) {
        currentSearchIndex = currentSearchResults.length - 1;
      }
    }
  }
  
  // Update UI
  if (currentSearchResults.length > 0) {
    searchResultsEl.textContent = `${currentSearchIndex + 1} of ${currentSearchResults.length}`;
    // Just update current highlight and scroll - don't recreate all highlights
    updateCurrentHighlight();
  }
  
  setStatus('info', `Match ${currentSearchIndex + 1} of ${currentSearchResults.length}`);
}

function updateCurrentHighlight() {
  try {
    const iframeDoc = previewEl.contentWindow.document;
    
    // Remove current highlight class from all highlights
    const highlights = iframeDoc.querySelectorAll('.search-highlight');
    highlights.forEach(highlight => {
      highlight.classList.remove('search-highlight-current');
    });
    
    // Add current highlight class to the correct one
    if (currentSearchIndex >= 0 && currentSearchIndex < highlights.length) {
      highlights[currentSearchIndex].classList.add('search-highlight-current');
      
      // Scroll to current highlight with small delay
      setTimeout(() => {
        const currentHighlight = iframeDoc.querySelector('.search-highlight-current');
        if (currentHighlight) {
          currentHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
    }
  } catch (err) {
    console.error('Failed to update current highlight:', err);
  }
}

function setPreview(html, charCount, wordCount) {
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
  
  // Display character and word count if provided
  if (charCount !== undefined && wordCount !== undefined) {
    setStatus('info', `${wordCount.toLocaleString()} words, ${charCount.toLocaleString()} chars`);
  } else {
    setStatus('info', `Loaded ${doc.length} chars`);
  }
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
    if (statusBarEl) statusBarEl.style.marginLeft = '280px';
  } else {
    previewEl.style.marginLeft = '0';
    if (statusBarEl) statusBarEl.style.marginLeft = '0';
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
    statusBarEl?.classList.add('dark-theme');
    statusBarEl?.classList.remove('light-theme');
  } else if (palette === 'light') {
    tocSidebarEl.classList.add('light-theme');
    tocSidebarEl.classList.remove('dark-theme');
    statusBarEl?.classList.add('light-theme');
    statusBarEl?.classList.remove('dark-theme');
  } else {
    // 'theme' - use system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      tocSidebarEl.classList.add('dark-theme');
      tocSidebarEl.classList.remove('light-theme');
      statusBarEl?.classList.add('dark-theme');
      statusBarEl?.classList.remove('light-theme');
    } else {
      tocSidebarEl.classList.add('light-theme');
      tocSidebarEl.classList.remove('dark-theme');
      statusBarEl?.classList.add('light-theme');
      statusBarEl?.classList.remove('dark-theme');
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
      setPreview(res.html, res.charCount, res.wordCount);
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
      setPreview(res.html, res.charCount, res.wordCount);
      renderTOC(res.toc);
      updateTOCTheme();
      
      // Re-run search if there was an active search
      if (searchOpen && searchInputEl.value) {
        setTimeout(() => {
          performSearch(searchInputEl.value);
        }, 100); // Small delay to ensure iframe is fully loaded
      }
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

// Search event listeners
searchInputEl.addEventListener('input', (e) => {
  performSearch(e.target.value);
});

searchInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    navigateSearch(e.shiftKey ? 'prev' : 'next');
  } else if (e.key === 'Escape') {
    e.preventDefault();
    closeSearch();
  }
});

searchPrevEl.addEventListener('click', () => {
  navigateSearch('prev');
});

searchNextEl.addEventListener('click', () => {
  navigateSearch('next');
});

searchCloseEl.addEventListener('click', () => {
  closeSearch();
});

searchCaseSensitiveEl.addEventListener('change', async () => {
  // Save the case sensitivity setting
  try {
    await SetSearchCaseSensitive(searchCaseSensitiveEl.checked);
  } catch (err) {
    console.error('Failed to save search case sensitivity:', err);
  }
  // Re-run current search with new case sensitivity
  performSearch(searchInputEl.value);
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
        if (statusBarEl) statusBarEl.style.marginLeft = '280px';

        // Update pin button icon for pinned state
        tocPinEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707l-4.95 4.95a.5.5 0 0 1-.707 0l-4.95-4.95a.5.5 0 0 1 0-.707l4.95-4.95a.5.5 0 0 1 .353-.146z"/>
        </svg>`;
        tocPinEl.title = 'Unpin sidebar';
      }
    } catch (err) {
      console.error(err);
    }

    // Load search settings
    try {
      const savedSearchCaseSensitive = await GetSearchCaseSensitive();
      searchCaseSensitiveEl.checked = savedSearchCaseSensitive;
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

// Add keyboard shortcuts event listener
document.addEventListener('keydown', handleKeyboardShortcuts);

// Helper functions for keyboard shortcuts
async function cyclePalette() {
    const options = ['light', 'dark', 'theme'];
    const currentIndex = options.indexOf(paletteEl.value);
    const nextIndex = (currentIndex + 1) % options.length;
    const nextPalette = options[nextIndex];

    paletteEl.value = nextPalette;
    try {
        await SetPalette(nextPalette);
        updateTOCTheme();
        await rerender();
        setStatus('info', `Palette: ${nextPalette} (${modifierKey === 'metaKey' ? 'Cmd' : 'Ctrl'}+Shift+L)`);
    } catch (err) {
        console.error(err);
    }
}

async function cycleTheme() {
    const themes = await ListThemes();
    if (!themes || themes.length === 0) return;

    const currentIndex = themes.indexOf(themeEl.value);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];

    themeEl.value = nextTheme;
    try {
        await SetTheme(nextTheme);
        await rerender();
        setStatus('info', `Theme: ${nextTheme} (${modifierKey === 'metaKey' ? 'Cmd' : 'Ctrl'}+Shift+T)`);
    } catch (err) {
        console.error(err);
    }
}

function handleKeyboardShortcuts(e) {
    // Check if we're focused on an input element (let browser handle those)
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
        // Allow Escape in search input to close search
        if (e.target.id === 'searchInput' && e.key === 'Escape') {
            // Let the search input handler handle this
            return;
        }
        return;
    }

    // Search functionality - NEW
    else if (e.key === '/' && !e[modifierKey] && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        openSearch();
        setStatus('info', 'Search opened (/)');
    }
    else if (e.key === 'f' && e[modifierKey]) {  // Ctrl+F / Cmd+F
        e.preventDefault();
        openSearch();
        setStatus('info', `Search opened (${modifierKey === 'metaKey' ? 'Cmd' : 'Ctrl'}+F)`);
    }
    else if (e.key === 'F3') {  // F3 - Next match
        e.preventDefault();
        if (searchOpen) {
            navigateSearch('next');
        }
    }
    else if (e.key === 'Escape' && searchOpen) {
        e.preventDefault();
        closeSearch();
        setStatus('info', 'Search closed (Esc)');
    }

    // File operations
    else if (e.key === 'o' && e[modifierKey]) {
        e.preventDefault();
        openAndRender();
        setStatus('info', `Opened file (${modifierKey === 'metaKey' ? 'Cmd' : 'Ctrl'}+O)`);
    }
    else if (e.key === 'r' && e[modifierKey]) {
        e.preventDefault();
        rerender();
        setStatus('info', `Reloaded file (${modifierKey === 'metaKey' ? 'Cmd' : 'Ctrl'}+R)`);
    }

    // View controls
    else if (e.key === 't' && e[modifierKey] && !e.shiftKey) {
        e.preventDefault();
        toggleTOC();
        setStatus('info', `TOC ${tocVisible ? 'shown' : 'hidden'} (${modifierKey === 'metaKey' ? 'Cmd' : 'Ctrl'}+T)`);
    }
    else if (e.key === 'p' && e[modifierKey]) {
        e.preventDefault();
        togglePin();
        setStatus('info', `TOC ${tocPinned ? 'pinned' : 'unpinned'} (${modifierKey === 'metaKey' ? 'Cmd' : 'Ctrl'}+P)`);
    }

    // Font size controls
    else if (e.key === '0' && e[modifierKey]) {
        e.preventDefault();
        fontScale = 100;
        updateFontUI();
        SetFontScale(fontScale);
        rerender();
        setStatus('info', `Reset font size (${modifierKey === 'metaKey' ? 'Cmd' : 'Ctrl'}+0)`);
    }
    else if ((e.key === '=' || e.key === '+') && e[modifierKey]) {
        e.preventDefault();
        fontScale = Math.min(200, fontScale + 10);
        updateFontUI();
        SetFontScale(fontScale);
        rerender();
        setStatus('info', `Increased font size (${modifierKey === 'metaKey' ? 'Cmd' : 'Ctrl'}+)`);
    }
    else if (e.key === '-' && e[modifierKey]) {
        e.preventDefault();
        fontScale = Math.max(50, fontScale - 10);
        updateFontUI();
        SetFontScale(fontScale);
        rerender();
        setStatus('info', `Decreased font size (${modifierKey === 'metaKey' ? 'Cmd' : 'Ctrl'}-)`);
    }

    // Theme cycling
    else if (e.key === 'l' && e[modifierKey] && e.shiftKey) {
        e.preventDefault();
        cyclePalette();
    }
    else if (e.key === 't' && e[modifierKey] && e.shiftKey) {
        e.preventDefault();
        cycleTheme();
    }

    // Close interfaces with Escape
    else if (e.key === 'Escape') {
        if (searchOpen) {
            e.preventDefault();
            closeSearch();
            setStatus('info', 'Search closed (Esc)');
        } else if (tocVisible) {
            e.preventDefault();
            toggleTOC();
            setStatus('info', 'Closed TOC (Esc)');
        }
    }
}

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
