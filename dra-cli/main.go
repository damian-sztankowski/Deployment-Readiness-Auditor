package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/spf13/cobra"
)

// --- ANSI COLORS ---
const (
	Reset  = "\033[0m"
	Red    = "\033[31m"
	Green  = "\033[32m"
	Yellow = "\033[33m"
	Blue   = "\033[34m"
	Bold   = "\033[1m"
)

// --- JSON STRUCTURES ---
type Compliance struct {
	Standard    string `json:"standard"`
	ControlID   string `json:"controlId"`
	Description string `json:"description"`
	Impact      string `json:"impact"`
}

type Finding struct {
	ID          string       `json:"id"`
	Severity    string       `json:"severity"`
	Category    string       `json:"category"`
	Title       string       `json:"title"`
	Description string       `json:"description"`
	Remediation string       `json:"remediation"`
	Fix         string       `json:"fix"`
	FileName    string       `json:"fileName"`
	LineNumber  int          `json:"lineNumber"`
	CostSavings string       `json:"costSavings"`
	Compliance  []Compliance `json:"compliance"`
}

type CategoryScore struct {
	Name        string `json:"name"`
	Score       int    `json:"score"`
	Status      string `json:"status"`
	Explanation string `json:"explanation"`
}

type AuditReport struct {
	Summary    string          `json:"summary"`
	Categories []CategoryScore `json:"categories"`
	Findings   []Finding       `json:"findings"`
	Diagram    string          `json:"diagram,omitempty"`
}

// --- SARIF 2.1.0 STRUCTURES ---
type SarifMessage struct {
	Text string `json:"text"`
}

type SarifArtifactLocation struct {
	URI string `json:"uri"`
}

type SarifRegion struct {
	StartLine int `json:"startLine"`
}

type SarifPhysicalLocation struct {
	ArtifactLocation SarifArtifactLocation `json:"artifactLocation"`
	Region           SarifRegion           `json:"region"`
}

type SarifLocation struct {
	PhysicalLocation SarifPhysicalLocation `json:"physicalLocation"`
}

type SarifResult struct {
	RuleID    string          `json:"ruleId"`
	Level     string          `json:"level"`
	Message   SarifMessage    `json:"message"`
	Locations []SarifLocation `json:"locations,omitempty"`
}

type SarifRuleShortDescription struct {
	Text string `json:"text"`
}

type SarifRule struct {
	ID               string                    `json:"id"`
	Name             string                    `json:"name"`
	ShortDescription SarifRuleShortDescription `json:"shortDescription"`
}

type SarifDriver struct {
	Name           string      `json:"name"`
	InformationURI string      `json:"informationUri"`
	Rules          []SarifRule `json:"rules"`
}

type SarifTool struct {
	Driver SarifDriver `json:"driver"`
}

type SarifRun struct {
	Tool    SarifTool     `json:"tool"`
	Results []SarifResult `json:"results"`
}

type SarifReport struct {
	Schema  string     `json:"$schema"`
	Version string     `json:"version"`
	Runs    []SarifRun `json:"runs"`
}

// --- CLI FLAGS ---
var scanPath string
var backendURL string
var deepScan bool
var autoApprove bool
var failOn string
var minScore int
var outputFormat string
var outputFile string
var fixPatchFile string
var llmProvider string
var llmModel string
var llmURL string

var rootCmd = &cobra.Command{
	Use:   "dra-cli",
	Short: "Deployment Readiness Auditor CLI",
	Long:  "CLI for semantic analysis of Terraform code against Google Cloud Architecture Framework.",
}

var scanCmd = &cobra.Command{
	Use:   "scan",
	Short: "Scans a specified directory with Terraform code",
	Run: func(cmd *cobra.Command, args []string) {
		logDest := os.Stdout
		if outputFormat != "console" {
			logDest = os.Stderr
		}

		if outputFormat == "console" {
			fmt.Fprintln(logDest, Bold+Blue+"===================================================="+Reset)
			fmt.Fprintln(logDest, Bold+"     Deployment Readiness Auditor (DRA) CLI         "+Reset)
			fmt.Fprintln(logDest, Bold+Blue+"===================================================="+Reset)
		}

		gcpToken := os.Getenv("GCP_IAM_TOKEN")
		isLocal := strings.Contains(backendURL, "localhost") || strings.Contains(backendURL, "127.0.0.1")
		if gcpToken == "" {
			if !isLocal {
				fmt.Fprintln(os.Stderr, Red+"❌ Error: Missing authorization token in GCP_IAM_TOKEN environment variable."+Reset)
				fmt.Fprintln(os.Stderr, "Please run: export GCP_IAM_TOKEN=$(gcloud auth print-identity-token)")
				os.Exit(1)
			} else if outputFormat == "console" {
				fmt.Fprintln(logDest, Yellow+"ℹ️  No GCP_IAM_TOKEN set. Proceeding without authorization header for local endpoint."+Reset)
			}
		}

		var targetFiles []string

		// --- FILE COLLECTION LOGIC ---
		fi, err := os.Stat(scanPath)
		if err != nil {
			fmt.Fprintf(os.Stderr, Red+"❌ Error accessing path '%s': %v\n"+Reset, scanPath, err)
			os.Exit(1)
		}

		if !fi.IsDir() {
			targetFiles = append(targetFiles, scanPath)
		} else if deepScan {
			if !autoApprove {
				fmt.Fprint(os.Stderr, Yellow+"⚠️  WARNING: Deep scan will analyze all subdirectories.\nThis may consume significant AI token quota. Continue? [y/N]: "+Reset)
				reader := bufio.NewReader(os.Stdin)
				response, _ := reader.ReadString('\n')
				response = strings.TrimSpace(strings.ToLower(response))
				if response != "y" && response != "yes" {
					fmt.Fprintln(os.Stderr, Red+"🛑 Scan aborted by user."+Reset)
					os.Exit(0)
				}
			}
			if outputFormat == "console" {
				fmt.Fprintln(logDest, "🕵️  Running deep scan...")
			}

			err := filepath.WalkDir(scanPath, func(path string, d os.DirEntry, err error) error {
				if err != nil {
					return err
				}
				if d.IsDir() && strings.HasPrefix(d.Name(), ".") && d.Name() != "." {
					return filepath.SkipDir
				}
				if !d.IsDir() {
					name := strings.ToLower(d.Name())
					if strings.HasSuffix(name, ".tf") || strings.HasSuffix(name, ".tfvars") || strings.HasSuffix(name, "plan.json") {
						targetFiles = append(targetFiles, path)
					}
				}
				return nil
			})
			if err != nil {
				fmt.Fprintf(os.Stderr, Red+"❌ Error during deep scan: %v\n"+Reset, err)
				os.Exit(1)
			}
		} else {
			files, err := os.ReadDir(scanPath)
			if err != nil {
				fmt.Fprintf(os.Stderr, Red+"❌ Error reading directory '%s': %v\n"+Reset, scanPath, err)
				os.Exit(1)
			}
			for _, file := range files {
				if !file.IsDir() {
					name := strings.ToLower(file.Name())
					if strings.HasSuffix(name, ".tf") || strings.HasSuffix(name, ".tfvars") || strings.HasSuffix(name, "plan.json") {
						targetFiles = append(targetFiles, filepath.Join(scanPath, file.Name()))
					}
				}
			}
		}

		if len(targetFiles) == 0 {
			fmt.Fprintf(os.Stderr, Yellow+"⚠️  No Terraform (.tf) or plan (.json) files found at '%s'.\n"+Reset, scanPath)
			os.Exit(0)
		}

		var combinedCode strings.Builder
		combinedCode.WriteString("# --- MULTI-FILE PROJECT ---\n\n")

		for _, path := range targetFiles {
			relPath, err := filepath.Rel(scanPath, path)
			if err != nil {
				relPath = filepath.Base(path)
			}

			localFile, err := os.Open(path)
			if err != nil {
				fmt.Fprintf(os.Stderr, Red+"❌ Error opening file %s: %v\n"+Reset, path, err)
				os.Exit(1)
			}

			content, err := io.ReadAll(localFile)
			localFile.Close()
			if err != nil {
				fmt.Fprintf(os.Stderr, Red+"❌ Error reading file content: %v\n"+Reset, err)
				os.Exit(1)
			}

			combinedCode.WriteString(fmt.Sprintf("### FILE: %s ###\n%s\n\n", relPath, string(content)))
		}

		type AuditRequest struct {
			Code        string `json:"code"`
			LlmProvider string `json:"llmProvider,omitempty"`
			LlmModel    string `json:"llmModel,omitempty"`
			LlmUrl      string `json:"llmUrl,omitempty"`
		}

		auditReq := AuditRequest{
			Code:        strings.TrimSpace(combinedCode.String()),
			LlmProvider: llmProvider,
			LlmModel:    llmModel,
			LlmUrl:      llmURL,
		}

		jsonData, err := json.Marshal(auditReq)
		if err != nil {
			fmt.Fprintf(os.Stderr, Red+"❌ Error encoding JSON payload: %v\n"+Reset, err)
			os.Exit(1)
		}

		if outputFormat == "console" {
			fmt.Fprintf(logDest, "📦 Found %d file(s). Transmitting payload to DRA Engine:\n-> %s... 🚀\n", len(targetFiles), backendURL)
		}

		req, err := http.NewRequest("POST", backendURL, bytes.NewBuffer(jsonData))
		if err != nil {
			fmt.Fprintf(os.Stderr, Red+"❌ Error creating HTTP request: %v\n"+Reset, err)
			os.Exit(1)
		}

		req.Header.Set("Content-Type", "application/json")
		if gcpToken != "" {
			req.Header.Set("Authorization", "Bearer "+gcpToken)
		}

		// Start loading spinner only for console output
		doneSpinner := make(chan struct{})
		if outputFormat == "console" {
			go startSpinner("Auditing HCL topology and verifying compliance mapping...", doneSpinner)
		}

		client := &http.Client{}
		resp, err := client.Do(req)

		if outputFormat == "console" {
			close(doneSpinner)
			fmt.Fprint(logDest, "\r\033[K") // Clear spinner line
		}

		if err != nil {
			fmt.Fprintf(os.Stderr, Red+"❌ Error connecting to DRA backend: %v\n"+Reset, err)
			os.Exit(1)
		}
		defer resp.Body.Close()

		respBody, err := io.ReadAll(resp.Body)
		if err != nil {
			fmt.Fprintf(os.Stderr, Red+"❌ Error reading response: %v\n"+Reset, err)
			os.Exit(1)
		}

		if resp.StatusCode != 200 {
			fmt.Fprintf(os.Stderr, Red+"❌ Server returned error [Status: %s]: %s\n"+Reset, resp.Status, string(respBody))
			os.Exit(1)
		}

		var report AuditReport
		err = json.Unmarshal(respBody, &report)
		if err != nil {
			fmt.Fprintf(os.Stderr, Red+"❌ Error decoding JSON response: %v\n"+Reset, err)
			os.Exit(1)
		}

		// --- STATS BADGE ---
		criticalCount := 0
		highCount := 0
		mediumCount := 0
		lowCount := 0
		infoCount := 0

		for _, f := range report.Findings {
			switch f.Severity {
			case "Critical":
				criticalCount++
			case "High":
				highCount++
			case "Medium":
				mediumCount++
			case "Low":
				lowCount++
			default:
				infoCount++
			}
		}

		var finalOutput string

		switch strings.ToLower(outputFormat) {
		case "json":
			indented, err := json.MarshalIndent(report, "", "  ")
			if err != nil {
				fmt.Fprintf(os.Stderr, Red+"❌ Error formatting JSON output: %v\n"+Reset, err)
				os.Exit(1)
			}
			finalOutput = string(indented)

		case "sarif":
			sarifData := buildSarifReport(report)
			indented, err := json.MarshalIndent(sarifData, "", "  ")
			if err != nil {
				fmt.Fprintf(os.Stderr, Red+"❌ Error formatting SARIF output: %v\n"+Reset, err)
				os.Exit(1)
			}
			finalOutput = string(indented)

		case "markdown", "md":
			finalOutput = buildMarkdownReport(report, targetFiles)

		default: // "console"
			fmt.Println("\n" + Bold + Blue + "====================================================" + Reset)
			fmt.Println("📊 " + Bold + "AUDIT RUN SUMMARY" + Reset)
			fmt.Println(Bold + Blue + "====================================================" + Reset)
			fmt.Printf("  🔍 Files Audited : %-10d   🔴 Critical Risks: %s%d%s\n", len(targetFiles), Red+Bold, criticalCount, Reset)
			fmt.Printf("  🟠 High Risks    : %-10d   🟡 Medium Risks  : %s%d%s\n", highCount, Yellow+Bold, mediumCount, Reset)
			fmt.Printf("  🔵 Low/Info Risks: %-10d\n", lowCount+infoCount)
			fmt.Println(Bold + Blue + "====================================================" + Reset)

			// --- EXECUTIVE SUMMARY ---
			fmt.Println("\n📢 " + Bold + "EXECUTIVE SUMMARY:" + Reset)
			fmt.Println()
			fmt.Printf("%s\n\n", report.Summary)

			// --- PILLAR SCORES WITH PROGRESS BARS ---
			fmt.Println(Bold + "📊 ARCHITECTURE PILLAR SCORES (Google Cloud Framework):" + Reset)
			fmt.Println()
			for i, cat := range report.Categories {
				statusIcon := Green + "✔" + Reset
				if cat.Status == "Critical" {
					statusIcon = Red + "✘" + Reset
				} else if cat.Status == "Warning" {
					statusIcon = Yellow + "!" + Reset
				}

				progressBar := drawProgressBar(cat.Score, cat.Status)
				paddedName := fmt.Sprintf("%-22s", cat.Name)
				fmt.Printf(" [%s] %s | %s %3d/100 | %s\n", statusIcon, Bold+paddedName+Reset, progressBar, cat.Score, cat.Explanation)
				if i < len(report.Categories)-1 {
					fmt.Println()
				}
			}

			// --- DETAILED FINDINGS ---
			fmt.Println(Bold + "\n🚨 DETAILED FINDINGS LOG:" + Reset)
			fmt.Println()
			if len(report.Findings) == 0 {
				fmt.Println(Green + " 🎉 Congratulations! No architectural violations detected." + Reset)
			} else {
				for i, f := range report.Findings {
					drawBoxedFinding(i+1, f)
				}
			}
			fmt.Println(Bold + Blue + "\n====================================================" + Reset)
		}

		if finalOutput != "" {
			fmt.Println(finalOutput)
		}

		if outputFile != "" {
			contentToWrite := finalOutput
			if contentToWrite == "" && outputFormat == "console" {
				contentToWrite = buildMarkdownReport(report, targetFiles)
			}
			err := os.WriteFile(outputFile, []byte(contentToWrite), 0644)
			if err != nil {
				fmt.Fprintf(os.Stderr, Red+"❌ Error saving output to %s: %v\n"+Reset, outputFile, err)
			} else if outputFormat == "console" {
				fmt.Printf("💾 Report successfully written to: %s\n", outputFile)
			}
		}

		if fixPatchFile != "" {
			patchContent := buildRemediationPatch(report)
			err := os.WriteFile(fixPatchFile, []byte(patchContent), 0644)
			if err != nil {
				fmt.Fprintf(os.Stderr, Red+"❌ Error saving remediation patch to %s: %v\n"+Reset, fixPatchFile, err)
			} else if outputFormat == "console" {
				fmt.Printf("🩹 Remediation patch written to: %s (Apply with: git apply %s)\n", fixPatchFile, fixPatchFile)
			}
		}

		// --- QUALITY GATE EVALUATION ---
		var gateFailures []string
		if failOn != "" {
			levels := strings.Split(strings.ToLower(failOn), ",")
			for _, lvl := range levels {
				lvl = strings.TrimSpace(lvl)
				if lvl == "critical" && criticalCount > 0 {
					gateFailures = append(gateFailures, fmt.Sprintf("%d Critical severity finding(s) detected", criticalCount))
				} else if lvl == "high" && highCount > 0 {
					gateFailures = append(gateFailures, fmt.Sprintf("%d High severity finding(s) detected", highCount))
				} else if lvl == "medium" && mediumCount > 0 {
					gateFailures = append(gateFailures, fmt.Sprintf("%d Medium severity finding(s) detected", mediumCount))
				} else if lvl == "low" && lowCount > 0 {
					gateFailures = append(gateFailures, fmt.Sprintf("%d Low severity finding(s) detected", lowCount))
				}
			}
		}

		if minScore > 0 {
			for _, cat := range report.Categories {
				if cat.Score < minScore {
					gateFailures = append(gateFailures, fmt.Sprintf("Pillar '%s' score (%d/100) is below minimum threshold (%d/100)", cat.Name, cat.Score, minScore))
				}
			}
		}

		if len(gateFailures) > 0 {
			fmt.Fprintln(os.Stderr, "\n"+Bold+Red+"===================================================="+Reset)
			fmt.Fprintln(os.Stderr, Bold+Red+"❌ DRA CI/CD QUALITY GATE: FAILED"+Reset)
			fmt.Fprintln(os.Stderr, Bold+Red+"===================================================="+Reset)
			for _, reason := range gateFailures {
				fmt.Fprintf(os.Stderr, "  • %s\n", reason)
			}
			fmt.Fprintln(os.Stderr, Bold+Red+"===================================================="+Reset)
			os.Exit(1)
		}
	},
}

// Helper: Build SARIF 2.1.0 Report
func buildSarifReport(report AuditReport) SarifReport {
	ruleMap := make(map[string]SarifRule)
	var sarifResults []SarifResult

	for _, f := range report.Findings {
		ruleID := f.Category
		if len(f.Compliance) > 0 && f.Compliance[0].ControlID != "" {
			ruleID = f.Compliance[0].ControlID
		}

		if _, exists := ruleMap[ruleID]; !exists {
			ruleMap[ruleID] = SarifRule{
				ID:   ruleID,
				Name: f.Title,
				ShortDescription: SarifRuleShortDescription{
					Text: f.Description,
				},
			}
		}

		level := "note"
		switch f.Severity {
		case "Critical", "High":
			level = "error"
		case "Medium":
			level = "warning"
		}

		msgText := f.Description
		if f.Remediation != "" {
			msgText += "\nRemediation: " + f.Remediation
		}

		line := f.LineNumber
		if line <= 0 {
			line = 1
		}

		loc := SarifLocation{
			PhysicalLocation: SarifPhysicalLocation{
				ArtifactLocation: SarifArtifactLocation{
					URI: f.FileName,
				},
				Region: SarifRegion{
					StartLine: line,
				},
			},
		}

		sarifResults = append(sarifResults, SarifResult{
			RuleID:    ruleID,
			Level:     level,
			Message:   SarifMessage{Text: msgText},
			Locations: []SarifLocation{loc},
		})
	}

	var rules []SarifRule
	for _, r := range ruleMap {
		rules = append(rules, r)
	}

	return SarifReport{
		Schema:  "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
		Version: "2.1.0",
		Runs: []SarifRun{
			{
				Tool: SarifTool{
					Driver: SarifDriver{
						Name:           "Deployment Readiness Auditor",
						InformationURI: "https://github.com/your-username/deployment-readiness-auditor",
						Rules:          rules,
					},
				},
				Results: sarifResults,
			},
		},
	}
}

// Helper: Build GitHub Markdown Report
func buildMarkdownReport(report AuditReport, files []string) string {
	var sb strings.Builder
	sb.WriteString("# 🛡️ Deployment Readiness Auditor (DRA) Report\n\n")
	sb.WriteString(fmt.Sprintf("- **Files Audited:** %d\n", len(files)))
	sb.WriteString(fmt.Sprintf("- **Timestamp:** %s\n\n", time.Now().UTC().Format(time.RFC1123)))

	sb.WriteString("## 📢 Executive Summary\n\n")
	sb.WriteString(report.Summary + "\n\n")

	sb.WriteString("## 📊 Architecture Pillar Scores (Google Cloud Framework)\n\n")
	sb.WriteString("| Status | Pillar | Score | Explanation |\n")
	sb.WriteString("| :---: | :--- | :---: | :--- |\n")
	for _, cat := range report.Categories {
		statusIcon := "🟢 Safe"
		if cat.Status == "Critical" {
			statusIcon = "🔴 Critical"
		} else if cat.Status == "Warning" {
			statusIcon = "🟡 Warning"
		}
		sb.WriteString(fmt.Sprintf("| %s | **%s** | %d/100 | %s |\n", statusIcon, cat.Name, cat.Score, cat.Explanation))
	}
	sb.WriteString("\n")

	sb.WriteString("## 🚨 Findings & Recommendations\n\n")
	if len(report.Findings) == 0 {
		sb.WriteString("🎉 **No architectural violations detected!**\n")
	} else {
		for i, f := range report.Findings {
			sevIcon := "ℹ️ INFO"
			switch f.Severity {
			case "Critical":
				sevIcon = "🔴 CRITICAL"
			case "High":
				sevIcon = "🟠 HIGH"
			case "Medium":
				sevIcon = "🟡 MEDIUM"
			case "Low":
				sevIcon = "🔵 LOW"
			}

			sb.WriteString(fmt.Sprintf("### %d. [%s] %s\n\n", i+1, sevIcon, f.Title))
			sb.WriteString(fmt.Sprintf("- **Category:** %s\n", f.Category))
			sb.WriteString(fmt.Sprintf("- **Location:** `%s` (Line %d)\n", f.FileName, f.LineNumber))
			sb.WriteString(fmt.Sprintf("- **Description:** %s\n", f.Description))
			sb.WriteString(fmt.Sprintf("- **Remediation:** %s\n", f.Remediation))
			if f.CostSavings != "" {
				sb.WriteString(fmt.Sprintf("- **FinOps Potential:** `%s`\n", f.CostSavings))
			}
			if len(f.Compliance) > 0 {
				sb.WriteString("- **Compliance:**\n")
				for _, c := range f.Compliance {
					sb.WriteString(fmt.Sprintf("  - **%s** (%s): %s\n", c.Standard, c.ControlID, c.Description))
				}
			}
			if f.Fix != "" {
				sb.WriteString("\n```hcl\n" + strings.TrimSpace(f.Fix) + "\n```\n")
			}
			sb.WriteString("\n---\n\n")
		}
	}

	return sb.String()
}

// Helper: Build Unified Git Remediation Patch
func buildRemediationPatch(report AuditReport) string {
	var sb strings.Builder
	sb.WriteString("# ========================================================\n")
	sb.WriteString("# DRA Automated Remediation Patch\n")
	sb.WriteString(fmt.Sprintf("# Generated: %s\n", time.Now().UTC().Format(time.RFC3339)))
	sb.WriteString("# To apply: git apply dra-remediation.patch\n")
	sb.WriteString("# ========================================================\n\n")

	byFile := make(map[string][]Finding)
	for _, f := range report.Findings {
		if strings.TrimSpace(f.Fix) != "" {
			fn := f.FileName
			if fn == "" {
				fn = "main.tf"
			}
			byFile[fn] = append(byFile[fn], f)
		}
	}

	for fileName, findings := range byFile {
		sb.WriteString(fmt.Sprintf("diff --git a/%s b/%s\n", fileName, fileName))
		sb.WriteString(fmt.Sprintf("--- a/%s\n", fileName))
		sb.WriteString(fmt.Sprintf("+++ b/%s\n", fileName))

		for idx, f := range findings {
			line := f.LineNumber
			if line <= 0 {
				line = 1
			}
			fixLines := strings.Split(strings.TrimSpace(f.Fix), "\n")
			sb.WriteString(fmt.Sprintf("@@ -%d,1 +%d,%d @@ [DRA Finding %d: %s]\n", line, line, len(fixLines)+2, idx+1, f.Title))
			sb.WriteString(fmt.Sprintf("+ # DRA-FIX [%s]: %s\n", strings.ToUpper(f.Severity), f.Title))
			for _, l := range fixLines {
				sb.WriteString(fmt.Sprintf("+ %s\n", l))
			}
			sb.WriteString("\n")
		}
	}

	return sb.String()
}

// Helper: Loading Spinner
func startSpinner(msg string, done chan struct{}) {
	frames := []string{
		"🤖        ",
		" 🤖       ",
		"  🤖      ",
		"   🤖     ",
		"    🤖    ",
		"     🤖   ",
		"      🤖  ",
		"       🤖 ",
		"        🤖",
		"       🤖 ",
		"      🤖  ",
		"     🤖   ",
		"    🤖    ",
		"   🤖     ",
		"  🤖      ",
		" 🤖       ",
	}
	i := 0
	for {
		select {
		case <-done:
			return
		default:
			fmt.Printf("\r\033[K%s %s", frames[i], msg)
			i = (i + 1) % len(frames)
			time.Sleep(85 * time.Millisecond)
		}
	}
}

// Helper: Visual Progress Bar
func drawProgressBar(score int, status string) string {
	width := 20
	filledLength := int(float64(score) / 100.0 * float64(width))
	if filledLength < 0 {
		filledLength = 0
	}
	if filledLength > width {
		filledLength = width
	}
	
	color := Green
	if status == "Critical" {
		color = Red
	} else if status == "Warning" {
		color = Yellow
	}
	
	bar := ""
	for i := 0; i < width; i++ {
		if i < filledLength {
			bar += "█"
		} else {
			bar += "░"
		}
	}
	return color + bar + Reset
}

// Helper: Boxed findings layout
func drawBoxedFinding(index int, f Finding) {
	sevIcon := "ℹ️ INFO"
	color := Blue
	if f.Severity == "Critical" {
		sevIcon = "🔴 CRITICAL"
		color = Red
	} else if f.Severity == "High" {
		sevIcon = "🟠 HIGH"
		color = Yellow
	} else if f.Severity == "Medium" {
		sevIcon = "🟡 MEDIUM"
		color = Yellow
	} else if f.Severity == "Low" {
		sevIcon = "🔵 LOW"
	}

	header := fmt.Sprintf(" %d. [%s] %s (Category: %s)", index, sevIcon, f.Title, f.Category)
	borderWidth := 80
	
	fmt.Printf("\n%s%s%s\n", color+Bold, strings.Repeat("━", borderWidth), Reset)
	fmt.Printf(" %s%s%s\n", Bold, header, Reset)
	fmt.Printf("%s%s%s\n", color, strings.Repeat("─", borderWidth), Reset)
	paddedLoc := fmt.Sprintf("%-12s", "Location")
	paddedDesc := fmt.Sprintf("%-12s", "Description")
	paddedRem := fmt.Sprintf("%-12s", "Remediation")
	fmt.Printf("  📍 %s: %s (Line %d)\n\n", Bold+paddedLoc+Reset, f.FileName, f.LineNumber)
	fmt.Printf("  📝 %s: %s\n\n", Bold+paddedDesc+Reset, f.Description)
	fmt.Printf("  🔧 %s: %s\n\n", Bold+paddedRem+Reset, f.Remediation)
	if f.CostSavings != "" {
		paddedFin := fmt.Sprintf("%-12s", "FinOps")
		fmt.Printf("  💰 %s: %s%s%s\n\n", Bold+paddedFin+Reset, Green, f.CostSavings, Reset)
	}
	if len(f.Compliance) > 0 {
		paddedComp := fmt.Sprintf("%-12s", "Compliance")
		fmt.Printf("  📋 %s:\n", Bold+paddedComp+Reset)
		for _, comp := range f.Compliance {
			fmt.Printf("      • %s (%s): %s\n", Bold+comp.Standard+Reset, comp.ControlID, comp.Description)
		}
		fmt.Println()
	}
	if f.Fix != "" {
		fmt.Printf("  %s%s%s\n", color, strings.Repeat("┈", borderWidth), Reset)
		fmt.Printf("  💡 %s:\n", Bold+"Suggested HCL Fix"+Reset)
		lines := strings.Split(strings.TrimSpace(f.Fix), "\n")
		for _, line := range lines {
			fmt.Printf("      %s%s%s\n", Green, line, Reset)
		}
	}
	fmt.Printf("%s%s%s\n", color+Bold, strings.Repeat("━", borderWidth), Reset)
}

// Colorize pflag output usages
func colorizeFlagUsages(usages string) string {
	lines := strings.Split(usages, "\n")
	var result []string
	for _, line := range lines {
		if strings.TrimSpace(line) == "" {
			result = append(result, line)
			continue
		}
		
		processedLine := line
		
		// 1. Colorize types (string, bool, int, etc)
		processedLine = strings.ReplaceAll(processedLine, " string ", " "+Blue+"string"+Reset+" ")
		processedLine = strings.ReplaceAll(processedLine, " bool ", " "+Blue+"bool"+Reset+" ")
		processedLine = strings.ReplaceAll(processedLine, " int ", " "+Blue+"int"+Reset+" ")
		
		// 2. Colorize long flags (e.g. --path)
		doubleDashIdx := strings.Index(processedLine, "--")
		if doubleDashIdx != -1 {
			rest := processedLine[doubleDashIdx:]
			endIdx := strings.IndexAny(rest, " =")
			if endIdx != -1 {
				flagName := rest[:endIdx]
				processedLine = processedLine[:doubleDashIdx] + Bold + Green + flagName + Reset + rest[endIdx:]
			}
		}
		
		// 3. Colorize short flags (e.g. -p)
		singleDashIdx := strings.Index(processedLine, " -")
		if singleDashIdx != -1 && singleDashIdx+3 < len(processedLine) && processedLine[singleDashIdx+2] != '-' {
			flagName := processedLine[singleDashIdx+1 : singleDashIdx+3] // "-p"
			processedLine = processedLine[:singleDashIdx+1] + Yellow + flagName + Reset + processedLine[singleDashIdx+3:]
		}

		// 4. Colorize default values, e.g. (default "...")
		defaultIdx := strings.Index(processedLine, "(default ")
		if defaultIdx != -1 {
			rest := processedLine[defaultIdx:]
			endIdx := strings.Index(rest, ")")
			if endIdx != -1 {
				defaultValue := rest[:endIdx+1]
				processedLine = processedLine[:defaultIdx] + Yellow + defaultValue + Reset + rest[endIdx+1:]
			}
		}
		
		result = append(result, processedLine)
	}
	return strings.Join(result, "\n")
}

// Custom formatted colored help screen
func customHelpFunc(c *cobra.Command, args []string) {
	fmt.Println("\n" + Bold + Blue + "====================================================" + Reset)
	fmt.Println("     " + Bold + "Deployment Readiness Auditor (DRA) CLI" + Reset)
	fmt.Println(Bold + Blue + "====================================================" + Reset)
	
	if c.Long != "" {
		fmt.Printf("\n%s\n", c.Long)
	} else if c.Short != "" {
		fmt.Printf("\n%s\n", c.Short)
	}
	
	fmt.Printf("\n%sUSAGE:%s\n  %s\n", Bold+Yellow, Reset, c.UseLine())
	
	if len(c.Commands()) > 0 {
		fmt.Printf("\n%sAVAILABLE COMMANDS:%s\n", Bold+Yellow, Reset)
		for _, sub := range c.Commands() {
			if !sub.Hidden {
				fmt.Printf("  %s%-12s%s %s\n", Bold+Green, sub.Name(), Reset, sub.Short)
			}
		}
	}
	
	localFlags := c.LocalFlags().FlagUsages()
	if localFlags != "" {
		fmt.Printf("\n%sFLAGS & OPTIONS:%s\n%s", Bold+Yellow, Reset, colorizeFlagUsages(localFlags))
	}
	
	inheritedFlags := c.InheritedFlags().FlagUsages()
	if inheritedFlags != "" {
		fmt.Printf("\n%sGLOBAL FLAGS:%s\n%s", Bold+Yellow, Reset, colorizeFlagUsages(inheritedFlags))
	}
	
	if len(c.Commands()) > 0 {
		fmt.Printf("\nUse \"%s [command] --help\" for more information about a command.\n\n", c.CommandPath())
	} else {
		fmt.Println()
	}
}

func init() {
	rootCmd.SetHelpFunc(customHelpFunc)
	scanCmd.SetHelpFunc(customHelpFunc)

	rootCmd.AddCommand(scanCmd)
	scanCmd.Flags().StringVarP(&scanPath, "path", "p", ".", "Path to the directory containing Terraform files")
	scanCmd.Flags().StringVarP(&backendURL, "endpoint", "e", "http://localhost:8080/api/audit", "DRA Backend API URL")
	scanCmd.Flags().BoolVarP(&deepScan, "deep-scan", "d", false, "Scan the directory and all subdirectories recursively")
	scanCmd.Flags().BoolVarP(&autoApprove, "yes", "y", false, "Automatically approve confirmation prompts (e.g. for deep scan in CI/CD)")
	scanCmd.Flags().StringVar(&failOn, "fail-on", "", "Fail with exit code 1 if severity threshold is reached (e.g. 'critical', 'high', 'critical,high')")
	scanCmd.Flags().IntVar(&minScore, "min-score", 0, "Fail with exit code 1 if any architecture pillar score drops below this minimum (0-100)")
	scanCmd.Flags().StringVarP(&outputFormat, "output", "o", "console", "Output format: console, json, sarif, markdown")
	scanCmd.Flags().StringVar(&outputFile, "output-file", "", "Path to write the report output (optional)")
	scanCmd.Flags().StringVar(&fixPatchFile, "fix-patch", "", "File path to generate and write a Git remediation patch (.patch)")
	scanCmd.Flags().StringVar(&llmProvider, "llm-provider", "", "LLM Provider (e.g. gemini, ollama)")
	scanCmd.Flags().StringVar(&llmModel, "llm-model", "", "LLM Model Name (e.g. gemini-3-pro-preview, gemma4:e2b)")
	scanCmd.Flags().StringVar(&llmURL, "llm-url", "", "Self-hosted LLM Endpoint URL")
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}
