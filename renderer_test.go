package main

import (
	"strings"
	"testing"
)

func TestRenderMarkdownWithTOCDedupAndSanitize(t *testing.T) {
	md := "# Intro\n\n## Intro\n\n<script>alert('x')</script>\n"
	out, err := RenderMarkdownWithTOC(md, "default", "light", 100)
	if err != nil {
		t.Fatalf("RenderMarkdownWithTOC returned error: %v", err)
	}

	if len(out.TOC) != 2 {
		t.Fatalf("expected 2 TOC entries, got %d", len(out.TOC))
	}
	if out.TOC[0].ID != "intro" || out.TOC[1].ID != "intro-2" {
		t.Fatalf("unexpected TOC IDs: %+v", out.TOC)
	}

	if strings.Contains(out.HTML, "<script") || strings.Contains(out.HTML, "alert('x')") {
		t.Fatalf("HTML should have been sanitized, got: %s", out.HTML)
	}
}
