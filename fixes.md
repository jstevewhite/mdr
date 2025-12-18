# Remediation Plan

Objectives: harden rendering security, improve robustness of auto-reload/TOC, and guard against resource exhaustion.

- [ ] **Harden markdown rendering (security P1)**  
  - Replace `html.WithUnsafe()` in `renderer.go` with sanitized output (e.g., `bluemonday.UGCPolicy()` or Goldmark `sanitize` extension) while retaining needed formatting; provide a bypass flag only if explicitly opted in.  
  - Add an iframe sandbox on the frontend (`frontend/src/main.js` preview element) with a minimal allowlist (ideally no `allow-same-origin` to keep scripts from touching the bridge) and set a strict CSP for the preview document (e.g., block scripts/remote loads).  
  - Add regression coverage that verifies script tags and inline event handlers are stripped/neutralized.

- [ ] **Robust auto-reload watcher (robustness P1)**  
  - Watch the parent directory instead of the single file, and handle `Rename`/`Remove` by re-attaching when the target reappears; surface watcher errors to the UI.  
  - Debounce rapid events and ensure watcher cleanup on stop/quit.  
  - Add a small test helper (Go) to simulate write+rename flows to confirm reloading works with atomic-save editors.

- [ ] **TOC ID collision handling (usability P2)**  
  - In `renderer.go` deduplicate generated IDs by suffixing counters when the same slug repeats.  
  - Add a test case with repeated headings to ensure unique anchors and correct TOC links.

- [ ] **Large file safety (robustness P2)**  
  - Introduce a configurable max file size for rendering; display a friendly warning instead of loading extremely large files.  
  - Consider streaming or chunked rendering if very large files must be supported; otherwise document the limit.  
  - Add a benchmark/limit check to keep the preview responsive.

- [ ] **Telemetry/logging for errors (observability P3)**  
  - Standardize error reporting from Go to the UI (file watch errors, theme load failures, config read/write issues) and show actionable messages in the status bar.  
  - Optionally add a debug console toggle to view recent errors/events.

Dependencies/notes: Implement security changes first (sanitization + sandbox), then watcher reliability, then usability/perf items. Keep user-config compatibility when adding new settings (size limits, toggles). 
