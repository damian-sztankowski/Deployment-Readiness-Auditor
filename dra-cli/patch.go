package main

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

var reResourceHeader = regexp.MustCompile(`^(resource\s+"[^"]+"\s+"[^"]+"\s*\{)`)

// findBlockEnd returns the index right after the matching closing brace '}' for a resource block.
func findBlockEnd(src string, startIdx int) int {
	depth := 0
	inQuotes := false
	for i := startIdx; i < len(src); i++ {
		ch := src[i]
		if ch == '"' && (i == 0 || src[i-1] != '\\') {
			inQuotes = !inQuotes
		}
		if !inQuotes {
			switch ch {
			case '{':
				depth++
			case '}':
				depth--
				if depth == 0 {
					return i + 1
				}
			}
		}
	}
	return -1
}

// buildSingleFileUnifiedDiff computes a valid unified diff between oldText and newText.
// Uses common prefix/suffix trimming with up to 3 lines of context so `git apply` succeeds cleanly.
func buildSingleFileUnifiedDiff(relPath, oldText, newText string) string {
	oldNorm := strings.ReplaceAll(oldText, "\r\n", "\n")
	newNorm := strings.ReplaceAll(newText, "\r\n", "\n")
	if !strings.HasSuffix(oldNorm, "\n") {
		oldNorm += "\n"
	}
	if !strings.HasSuffix(newNorm, "\n") {
		newNorm += "\n"
	}
	if oldNorm == newNorm {
		return ""
	}

	oldLines := strings.Split(strings.TrimSuffix(oldNorm, "\n"), "\n")
	newLines := strings.Split(strings.TrimSuffix(newNorm, "\n"), "\n")

	prefix := 0
	for prefix < len(oldLines) && prefix < len(newLines) && oldLines[prefix] == newLines[prefix] {
		prefix++
	}

	oldEnd := len(oldLines)
	newEnd := len(newLines)
	for oldEnd > prefix && newEnd > prefix && oldLines[oldEnd-1] == newLines[newEnd-1] {
		oldEnd--
		newEnd--
	}

	ctxBefore := prefix - 3
	if ctxBefore < 0 {
		ctxBefore = 0
	}
	oldCtxAfter := oldEnd + 3
	if oldCtxAfter > len(oldLines) {
		oldCtxAfter = len(oldLines)
	}
	suffixCount := oldCtxAfter - oldEnd

	oldStartLine := ctxBefore + 1
	oldCount := (oldEnd - ctxBefore) + suffixCount
	newStartLine := ctxBefore + 1
	newCount := (newEnd - ctxBefore) + suffixCount

	var sb strings.Builder
	cleanRel := filepath.ToSlash(relPath)
	sb.WriteString(fmt.Sprintf("diff --git a/%s b/%s\n", cleanRel, cleanRel))
	sb.WriteString(fmt.Sprintf("--- a/%s\n", cleanRel))
	sb.WriteString(fmt.Sprintf("+++ b/%s\n", cleanRel))
	sb.WriteString(fmt.Sprintf("@@ -%d,%d +%d,%d @@\n", oldStartLine, oldCount, newStartLine, newCount))

	for i := ctxBefore; i < prefix; i++ {
		sb.WriteString(" " + oldLines[i] + "\n")
	}
	for i := prefix; i < oldEnd; i++ {
		sb.WriteString("-" + oldLines[i] + "\n")
	}
	for i := prefix; i < newEnd; i++ {
		sb.WriteString("+" + newLines[i] + "\n")
	}
	for i := oldEnd; i < oldCtxAfter; i++ {
		sb.WriteString(" " + oldLines[i] + "\n")
	}

	return sb.String()
}

// BuildVerifiedGitPatch applies findings against local files in basePath and produces a valid `git apply` patch.
func BuildVerifiedGitPatch(report AuditReport, basePath string) string {
	byFile := make(map[string][]Finding)
	var fileOrder []string

	for _, f := range report.Findings {
		if strings.TrimSpace(f.Fix) == "" || f.Waived {
			continue
		}
		fn := f.FileName
		if fn == "" {
			fn = "main.tf"
		}
		if _, seen := byFile[fn]; !seen {
			fileOrder = append(fileOrder, fn)
		}
		byFile[fn] = append(byFile[fn], f)
	}

	if len(fileOrder) == 0 {
		return "# No automated remediations available.\n"
	}

	var combined strings.Builder
	fi, statErr := os.Stat(basePath)
	isSingleFile := statErr == nil && !fi.IsDir()

	for _, fn := range fileOrder {
		var diskPath string
		var relName string
		if isSingleFile {
			diskPath = basePath
			relName = filepath.Base(basePath)
		} else {
			diskPath = filepath.Join(basePath, fn)
			relName = fn
		}

		rawBytes, err := os.ReadFile(diskPath)
		if err != nil {
			continue
		}
		original := string(rawBytes)
		updated := original

		for _, f := range byFile[fn] {
			fixTrimmed := strings.TrimSpace(f.Fix)
			if f.OriginalSnippet != "" && strings.Contains(updated, strings.TrimSpace(f.OriginalSnippet)) {
				updated = strings.Replace(updated, strings.TrimSpace(f.OriginalSnippet), fixTrimmed, 1)
				continue
			}

			if m := reResourceHeader.FindStringSubmatch(fixTrimmed); len(m) > 1 {
				idx := strings.Index(updated, m[1])
				if idx != -1 {
					endIdx := findBlockEnd(updated, idx)
					if endIdx > idx {
						updated = updated[:idx] + fixTrimmed + updated[endIdx:]
						continue
					}
				}
			}
		}

		if updated != original {
			diff := buildSingleFileUnifiedDiff(relName, original, updated)
			if diff != "" {
				combined.WriteString(diff)
			}
		}
	}

	if combined.Len() > 0 {
		return combined.String()
	}

	// Fallback valid new-file git patch when source blocks are not present locally (e.g. --demo mode)
	var overrideLines []string
	overrideLines = append(overrideLines, "# DRA v3.0 Consolidated Remediations")
	for i, fn := range fileOrder {
		for _, f := range byFile[fn] {
			overrideLines = append(overrideLines, fmt.Sprintf("# [%d] %s: %s (%s:%d)", i+1, strings.ToUpper(f.Severity), f.Title, fn, f.LineNumber))
			overrideLines = append(overrideLines, strings.Split(strings.TrimSpace(f.Fix), "\n")...)
			overrideLines = append(overrideLines, "")
		}
	}

	var fallback strings.Builder
	fallback.WriteString("diff --git a/dra-remediated-overrides.tf b/dra-remediated-overrides.tf\n")
	fallback.WriteString("new file mode 100644\n")
	fallback.WriteString("--- /dev/null\n")
	fallback.WriteString("+++ b/dra-remediated-overrides.tf\n")
	fallback.WriteString(fmt.Sprintf("@@ -0,0 +1,%d @@\n", len(overrideLines)))
	for _, l := range overrideLines {
		fallback.WriteString("+" + l + "\n")
	}
	return fallback.String()
}
