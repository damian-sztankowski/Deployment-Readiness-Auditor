package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/spf13/cobra"
)

const CliVersion = "3.1.0"

// --- DYNAMIC ANSI COLOR SUPPORT (POSIX NO_COLOR & TTY AWARE) ---
var (
	Reset  = "\033[0m"
	Red    = "\033[31m"
	Green  = "\033[32m"
	Yellow = "\033[33m"
	Blue   = "\033[34m"
	Bold   = "\033[1m"
)

func isTerminalFile(f *os.File) bool {
	if f == nil {
		return false
	}
	fi, err := f.Stat()
	if err != nil {
		return false
	}
	return (fi.Mode() & os.ModeCharDevice) != 0
}

func shouldEnableColor(noColorFlag bool) bool {
	if noColorFlag {
		return false
	}
	if _, exists := os.LookupEnv("NO_COLOR"); exists {
		return false
	}
	if strings.EqualFold(os.Getenv("TERM"), "dumb") {
		return false
	}
	return isTerminalFile(os.Stdout)
}

func configureColors(enable bool) {
	if !enable {
		Reset = ""
		Red = ""
		Green = ""
		Yellow = ""
		Blue = ""
		Bold = ""
	}
}

// --- JSON STRUCTURES ---
type Compliance struct {
	Standard    string `json:"standard"`
	ControlID   string `json:"controlId"`
	Description string `json:"description"`
	Impact      string `json:"impact"`
}

type Finding struct {
	ID              string       `json:"id"`
	Severity        string       `json:"severity"`
	Category        string       `json:"category"`
	Title           string       `json:"title"`
	Description     string       `json:"description"`
	Remediation     string       `json:"remediation"`
	Fix             string       `json:"fix"`
	OriginalSnippet string       `json:"originalSnippet,omitempty"`
	FileName        string       `json:"fileName"`
	LineNumber      int          `json:"lineNumber"`
	EndLineNumber   int          `json:"endLineNumber,omitempty"`
	CostSavings     string       `json:"costSavings"`
	Source          string       `json:"source,omitempty"`
	Waived          bool         `json:"waived,omitempty"`
	WaiverReason    string       `json:"waiverReason,omitempty"`
	Compliance      []Compliance `json:"compliance"`
}

type CategoryScore struct {
	Name        string `json:"name"`
	Score       int    `json:"score"`
	Status      string `json:"status"`
	Explanation string `json:"explanation"`
}

type FinOpsSummary struct {
	Region                       string  `json:"region"`
	EstimatedCurrentMonthlyUsd   float64 `json:"estimatedCurrentMonthlyUsd"`
	EstimatedOptimizedMonthlyUsd float64 `json:"estimatedOptimizedMonthlyUsd"`
	PotentialMonthlySavingsUsd   float64 `json:"potentialMonthlySavingsUsd"`
	AnnualSavingsUsd             float64 `json:"annualSavingsUsd"`
}

type AuditReport struct {
	Summary        string          `json:"summary"`
	Categories     []CategoryScore `json:"categories"`
	Findings       []Finding       `json:"findings"`
	WaivedFindings []Finding       `json:"waivedFindings,omitempty"`
	FinOps         *FinOpsSummary  `json:"finops,omitempty"`
	Diagram        string          `json:"diagram,omitempty"`
	Model          string          `json:"model,omitempty"`
	Provider       string          `json:"provider,omitempty"`
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
	EndLine   int `json:"endLine,omitempty"`
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
	Version        string      `json:"version"`
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
var (
	scanPath     string
	backendURL   string
	deepScan     bool
	autoApprove  bool
	failOn       string
	minScore     int
	outputFormat string
	outputFile   string
	fixPatchFile string
	llmProvider  string
	llmModel     string
	llmURL       string
	authToken    string
	apiKey       string
	demoMode     bool
	enableDlp    bool
	noColor      bool
	timeoutSec   int
	policyPath   string
	changedOnly  bool
	gitBaseRef   string
)

func isSupportedIacFile(name string) bool {
	lower := strings.ToLower(filepath.Base(name))
	if lower == ".dra.yaml" || lower == "dra.yaml" || lower == ".dra.yml" || lower == "dra.yml" {
		return false
	}
	return strings.HasSuffix(lower, ".tf") ||
		strings.HasSuffix(lower, ".tofu") ||
		strings.HasSuffix(lower, ".tfvars") ||
		strings.HasSuffix(lower, "plan.json") ||
		strings.HasSuffix(lower, ".yaml") ||
		strings.HasSuffix(lower, ".yml") ||
		lower == "dockerfile" ||
		strings.HasPrefix(lower, "dockerfile.")
}

func collectGitChangedFiles(rootPath, baseRef string) ([]string, error) {
	ref := baseRef
	if ref == "" {
		ref = "HEAD~1"
	}
	cmd := exec.Command("git", "-C", rootPath, "diff", "--name-only", "--diff-filter=ACMRTUXB", ref)
	out, err := cmd.Output()
	if err != nil {
		return nil, err
	}
	var matched []string
	for _, line := range strings.Split(strings.TrimSpace(string(out)), "\n") {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			continue
		}
		full := filepath.Join(rootPath, trimmed)
		if _, err := os.Stat(full); err == nil && isSupportedIacFile(trimmed) {
			matched = append(matched, full)
		}
	}
	return matched, nil
}

func loadPolicyFile(explicitPath, scanDir string) string {
	candidates := []string{}
	if explicitPath != "" {
		candidates = append(candidates, explicitPath)
	} else {
		candidates = append(candidates,
			filepath.Join(scanDir, ".dra.yaml"),
			filepath.Join(scanDir, "dra.yaml"),
			".dra.yaml",
			"dra.yaml",
		)
	}
	for _, p := range candidates {
		data, err := os.ReadFile(p)
		if err == nil && len(bytes.TrimSpace(data)) > 0 {
			return string(data)
		}
	}
	return ""
}

func doRequestWithRetry(client *http.Client, url string, payload []byte, headers map[string]string) (*http.Response, []byte, error) {
	maxAttempts := 3
	for attempt := 1; attempt <= maxAttempts; attempt++ {
		req, err := http.NewRequest("POST", url, bytes.NewBuffer(payload))
		if err != nil {
			return nil, nil, err
		}
		for k, v := range headers {
			req.Header.Set(k, v)
		}

		resp, err := client.Do(req)
		if err != nil {
			if attempt == maxAttempts {
				return nil, nil, err
			}
			time.Sleep(time.Duration(attempt*2) * time.Second)
			continue
		}

		body, readErr := io.ReadAll(resp.Body)
		resp.Body.Close()
		if readErr != nil {
			return resp, nil, readErr
		}

		if resp.StatusCode == http.StatusTooManyRequests && attempt < maxAttempts {
			waitSec := attempt * 3
			if ra := resp.Header.Get("Retry-After"); ra != "" {
				if parsed, err := strconv.Atoi(ra); err == nil && parsed > 0 && parsed <= 60 {
					waitSec = parsed
				}
			}
			time.Sleep(time.Duration(waitSec) * time.Second)
			continue
		}

		return resp, body, nil
	}
	return nil, nil, fmt.Errorf("request exhausted retry attempts")
}

var rootCmd = &cobra.Command{
	Use:     "dra-cli",
	Version: CliVersion,
	Short:   "Deployment Readiness Auditor CLI (v3.0)",
	Long:    "Hybrid Deterministic AST & AI readiness gatekeeper for Google Cloud Terraform, OpenTofu, and Kubernetes.",
}

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Print DRA CLI version information",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Printf("dra-cli version %s\n", CliVersion)
	},
}

var scanCmd = &cobra.Command{
	Use:   "scan",
	Short: "Scan Infrastructure as Code files against Well-Architected & compliance benchmarks",
	Run: func(cmd *cobra.Command, args []string) {
		enableColors := shouldEnableColor(noColor)
		configureColors(enableColors)
		interactiveTTY := isTerminalFile(os.Stdout) && isTerminalFile(os.Stderr) && os.Getenv("CI") == ""

		logDest := os.Stdout
		if outputFormat != "console" {
			logDest = os.Stderr
		}

		if outputFormat == "console" {
			fmt.Fprintln(logDest, Bold+Blue+"===================================================="+Reset)
			fmt.Fprintf(logDest, Bold+"   Deployment Readiness Auditor (DRA) CLI v%s\n"+Reset, CliVersion)
			fmt.Fprintln(logDest, Bold+Blue+"===================================================="+Reset)
		}

		if backendURL == "http://localhost:8080/api/audit" && os.Getenv("DRA_ENDPOINT") != "" {
			backendURL = os.Getenv("DRA_ENDPOINT")
		}

		if authToken == "" {
			for _, envKey := range []string{"GCP_IAM_TOKEN", "DRA_TOKEN", "AUTH_TOKEN"} {
				if v := os.Getenv(envKey); v != "" {
					authToken = v
					break
				}
			}
		}

		if apiKey == "" {
			for _, envKey := range []string{"DRA_API_KEY", "API_KEY", "GEMINI_API_KEY"} {
				if v := os.Getenv(envKey); v != "" {
					apiKey = v
					break
				}
			}
		}

		fi, err := os.Stat(scanPath)
		if err != nil {
			fmt.Fprintf(os.Stderr, Red+"❌ Error accessing path '%s': %v\n"+Reset, scanPath, err)
			os.Exit(1)
		}

		var targetFiles []string

		if !fi.IsDir() {
			targetFiles = append(targetFiles, scanPath)
		} else if changedOnly {
			changed, gitErr := collectGitChangedFiles(scanPath, gitBaseRef)
			if gitErr != nil {
				fmt.Fprintf(os.Stderr, Yellow+"⚠️  Unable to resolve git diff against '%s' (%v); falling back to directory scan.\n"+Reset, gitBaseRef, gitErr)
			} else {
				targetFiles = changed
			}
		}

		if len(targetFiles) == 0 && fi.IsDir() && !changedOnly {
			if deepScan {
				if !autoApprove && isTerminalFile(os.Stdin) && os.Getenv("CI") == "" {
					fmt.Fprint(os.Stderr, Yellow+"⚠️  Deep scan will analyze all subdirectories. Continue? [y/N]: "+Reset)
					reader := bufio.NewReader(os.Stdin)
					response, _ := reader.ReadString('\n')
					response = strings.TrimSpace(strings.ToLower(response))
					if response != "y" && response != "yes" {
						fmt.Fprintln(os.Stderr, Red+"🛑 Scan aborted by user."+Reset)
						os.Exit(0)
					}
				}
				err := filepath.WalkDir(scanPath, func(path string, d os.DirEntry, err error) error {
					if err != nil {
						return err
					}
					if d.IsDir() {
						name := d.Name()
						if (strings.HasPrefix(name, ".") && name != ".") || name == "node_modules" || name == "dist" || name == "vendor" {
							return filepath.SkipDir
						}
						return nil
					}
					if isSupportedIacFile(d.Name()) {
						targetFiles = append(targetFiles, path)
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
					if !file.IsDir() && isSupportedIacFile(file.Name()) {
						targetFiles = append(targetFiles, filepath.Join(scanPath, file.Name()))
					}
				}
			}
		}

		if len(targetFiles) == 0 {
			fmt.Fprintf(os.Stderr, Yellow+"⚠️  No supported IaC files (.tf, .tofu, tfplan.json, K8s .yaml, Dockerfile) found at '%s'.\n"+Reset, scanPath)
			os.Exit(0)
		}

		var combinedCode strings.Builder
		combinedCode.WriteString("# --- MULTI-FILE PROJECT ---\n\n")

		for _, p := range targetFiles {
			relPath := filepath.Base(p)
			if fi.IsDir() {
				if r, relErr := filepath.Rel(scanPath, p); relErr == nil {
					relPath = filepath.ToSlash(r)
				}
			}
			content, readErr := os.ReadFile(p)
			if readErr != nil {
				fmt.Fprintf(os.Stderr, Red+"❌ Error reading %s: %v\n"+Reset, p, readErr)
				os.Exit(1)
			}
			combinedCode.WriteString(fmt.Sprintf("### FILE: %s ###\n%s\n\n", relPath, string(content)))
		}

		rawPayloadCode := strings.TrimSpace(combinedCode.String())
		var dlpRes DlpResult
		if enableDlp {
			dlpRes = AnonymizeHCL(rawPayloadCode)
			rawPayloadCode = dlpRes.SanitizedCode
		}

		policyDir := scanPath
		if !fi.IsDir() {
			policyDir = filepath.Dir(scanPath)
		}
		policyYamlContent := loadPolicyFile(policyPath, policyDir)

		type AuditRequest struct {
			Code        string `json:"code"`
			PolicyYaml  string `json:"policyYaml,omitempty"`
			LlmProvider string `json:"llmProvider,omitempty"`
			LlmModel    string `json:"llmModel,omitempty"`
			LlmUrl      string `json:"llmUrl,omitempty"`
		}

		auditReq := AuditRequest{
			Code:        rawPayloadCode,
			PolicyYaml:  policyYamlContent,
			LlmProvider: llmProvider,
			LlmModel:    llmModel,
			LlmUrl:      llmURL,
		}

		jsonData, err := json.Marshal(auditReq)
		if err != nil {
			fmt.Fprintf(os.Stderr, Red+"❌ Error encoding JSON payload: %v\n"+Reset, err)
			os.Exit(1)
		}

		var report AuditReport

		if demoMode {
			if outputFormat == "console" {
				fmt.Fprintln(logDest, "✨ Running in Demo Mode (Simulated Hybrid Audit Engine)...")
			}
			report = getMockAuditReport()
		} else {
			if outputFormat == "console" {
				fmt.Fprintf(logDest, "📦 Auditing %d file(s) (%d sensitive fields scrubbed locally) -> %s\n", len(targetFiles), dlpRes.RedactionCount, backendURL)
			}

			headers := map[string]string{
				"Content-Type": "application/json",
				"User-Agent":   "dra-cli/" + CliVersion,
			}
			if authToken != "" {
				headers["Authorization"] = "Bearer " + authToken
			}
			if apiKey != "" {
				headers["X-API-Key"] = apiKey
				if authToken == "" {
					headers["Authorization"] = "Bearer " + apiKey
				}
			}

			doneSpinner := make(chan struct{})
			if outputFormat == "console" && interactiveTTY {
				go startSpinner("Auditing AST blocks, FinOps SKUs, and compliance controls...", doneSpinner)
			}

			client := &http.Client{
				Timeout: time.Duration(timeoutSec) * time.Second,
			}
			resp, respBody, reqErr := doRequestWithRetry(client, backendURL, jsonData, headers)

			if outputFormat == "console" && interactiveTTY {
				close(doneSpinner)
				fmt.Fprint(logDest, "\r\033[K")
			}

			if reqErr != nil {
				fmt.Fprintf(os.Stderr, Red+"❌ Error connecting to DRA backend: %v\n"+Reset, reqErr)
				os.Exit(1)
			}

			if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
				fmt.Fprintf(os.Stderr, Red+"❌ Authentication failed [%s]: %s\n"+Reset, resp.Status, string(respBody))
				fmt.Fprintln(os.Stderr, Yellow+"\n💡 Authenticate dra-cli using one of:"+Reset)
				fmt.Fprintln(os.Stderr, "   • OIDC Identity Token: export GCP_IAM_TOKEN=$(gcloud auth print-identity-token)")
				fmt.Fprintln(os.Stderr, "   • Backend API Key:     export DRA_API_KEY=<your-key>")
				fmt.Fprintln(os.Stderr, "   • Offline CI Demo:     dra-cli scan --demo")
				os.Exit(1)
			}

			if resp.StatusCode != http.StatusOK {
				fmt.Fprintf(os.Stderr, Red+"❌ Server returned error [%s]: %s\n"+Reset, resp.Status, string(respBody))
				os.Exit(1)
			}

			if err := json.Unmarshal(respBody, &report); err != nil {
				fmt.Fprintf(os.Stderr, Red+"❌ Error decoding JSON response: %v\n"+Reset, err)
				os.Exit(1)
			}

			if enableDlp {
				DeanonymizeReport(&report, dlpRes.AliasMap)
			}
		}

		// --- SEVERITY TALLY ---
		criticalCount, highCount, mediumCount, lowCount, infoCount := 0, 0, 0, 0, 0
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
			indented, _ := json.MarshalIndent(report, "", "  ")
			finalOutput = string(indented)
		case "sarif":
			sarifData := buildSarifReport(report)
			indented, _ := json.MarshalIndent(sarifData, "", "  ")
			finalOutput = string(indented)
		case "markdown", "md":
			finalOutput = buildMarkdownReport(report, targetFiles, false)
		case "github-pr":
			finalOutput = buildMarkdownReport(report, targetFiles, true)
		default:
			renderConsoleReport(report, targetFiles, criticalCount, highCount, mediumCount, lowCount, infoCount)
		}

		if finalOutput != "" {
			fmt.Println(finalOutput)
		}

		if outputFile != "" {
			contentToWrite := finalOutput
			if contentToWrite == "" {
				contentToWrite = buildMarkdownReport(report, targetFiles, true)
			}
			if err := os.WriteFile(outputFile, []byte(contentToWrite), 0644); err != nil {
				fmt.Fprintf(os.Stderr, Red+"❌ Error saving output to %s: %v\n"+Reset, outputFile, err)
			} else if outputFormat == "console" {
				fmt.Printf("💾 Report written to: %s\n", outputFile)
			}
		}

		if fixPatchFile != "" {
			patchContent := BuildVerifiedGitPatch(report, scanPath)
			if err := os.WriteFile(fixPatchFile, []byte(patchContent), 0644); err != nil {
				fmt.Fprintf(os.Stderr, Red+"❌ Error saving remediation patch to %s: %v\n"+Reset, fixPatchFile, err)
			} else if outputFormat == "console" {
				fmt.Printf("🩹 Verified Git patch written to: %s (Apply with: git apply %s)\n", fixPatchFile, fixPatchFile)
			}
		}

		// --- CI/CD QUALITY GATE ---
		gateFailures := evaluateQualityGate(report, failOn, minScore, criticalCount, highCount, mediumCount, lowCount)
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

func evaluateQualityGate(report AuditReport, failOnSpec string, minPillarScore, crit, high, med, low int) []string {
	var failures []string
	if failOnSpec != "" {
		for _, lvl := range strings.Split(strings.ToLower(failOnSpec), ",") {
			switch strings.TrimSpace(lvl) {
			case "critical":
				if crit > 0 {
					failures = append(failures, fmt.Sprintf("%d Critical severity finding(s) detected", crit))
				}
			case "high":
				if high > 0 {
					failures = append(failures, fmt.Sprintf("%d High severity finding(s) detected", high))
				}
			case "medium":
				if med > 0 {
					failures = append(failures, fmt.Sprintf("%d Medium severity finding(s) detected", med))
				}
			case "low":
				if low > 0 {
					failures = append(failures, fmt.Sprintf("%d Low severity finding(s) detected", low))
				}
			}
		}
	}

	if minPillarScore > 0 {
		for _, cat := range report.Categories {
			if cat.Score < minPillarScore {
				failures = append(failures, fmt.Sprintf("Pillar '%s' score (%d/100) is below minimum threshold (%d/100)", cat.Name, cat.Score, minPillarScore))
			}
		}
	}
	return failures
}

func renderConsoleReport(report AuditReport, targetFiles []string, criticalCount, highCount, mediumCount, lowCount, infoCount int) {
	fmt.Println("\n" + Bold + Blue + "====================================================" + Reset)
	fmt.Println("📊 " + Bold + "AUDIT RUN SUMMARY" + Reset)
	fmt.Println(Bold + Blue + "====================================================" + Reset)
	fmt.Printf("  🔍 Files Audited : %-10d   🔴 Critical Risks: %s%d%s\n", len(targetFiles), Red+Bold, criticalCount, Reset)
	fmt.Printf("  🟠 High Risks    : %-10d   🟡 Medium Risks  : %s%d%s\n", highCount, Yellow+Bold, mediumCount, Reset)
	fmt.Printf("  🔵 Low/Info Risks: %-10d   ⚖️  Waived Risks  : %d\n", lowCount+infoCount, len(report.WaivedFindings))
	if report.FinOps != nil && report.FinOps.PotentialMonthlySavingsUsd > 0 {
		fmt.Printf("  💰 FinOps Waste  : %s$%.2f/mo ($%.2f/yr) in %s%s\n", Green+Bold, report.FinOps.PotentialMonthlySavingsUsd, report.FinOps.AnnualSavingsUsd, report.FinOps.Region, Reset)
	}
	fmt.Println(Bold + Blue + "====================================================" + Reset)

	fmt.Println("\n📢 " + Bold + "EXECUTIVE SUMMARY:" + Reset)
	fmt.Printf("\n%s\n\n", report.Summary)

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
		paddedName := fmt.Sprintf("%-24s", cat.Name)
		fmt.Printf(" [%s] %s | %s %3d/100 | %s\n", statusIcon, Bold+paddedName+Reset, progressBar, cat.Score, cat.Explanation)
		if i < len(report.Categories)-1 {
			fmt.Println()
		}
	}

	fmt.Println(Bold + "\n🚨 DETAILED FINDINGS LOG:" + Reset)
	fmt.Println()
	if len(report.Findings) == 0 {
		fmt.Println(Green + " 🎉 Congratulations! No active architectural violations detected." + Reset)
	} else {
		for i, f := range report.Findings {
			drawBoxedFinding(i+1, f)
		}
	}
	fmt.Println(Bold + Blue + "\n====================================================" + Reset)
}

func buildSarifReport(report AuditReport) SarifReport {
	ruleMap := make(map[string]SarifRule)
	sarifResults := make([]SarifResult, 0, len(report.Findings))

	for _, f := range report.Findings {
		ruleID := f.Category
		if len(f.Compliance) > 0 && f.Compliance[0].ControlID != "" {
			ruleID = f.Compliance[0].ControlID
		}
		if ruleID == "" {
			ruleID = f.ID
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
		reg := SarifRegion{StartLine: line}
		if f.EndLineNumber > line {
			reg.EndLine = f.EndLineNumber
		}

		fileURI := f.FileName
		if fileURI == "" {
			fileURI = "main.tf"
		}

		sarifResults = append(sarifResults, SarifResult{
			RuleID:  ruleID,
			Level:   level,
			Message: SarifMessage{Text: msgText},
			Locations: []SarifLocation{
				{
					PhysicalLocation: SarifPhysicalLocation{
						ArtifactLocation: SarifArtifactLocation{URI: fileURI},
						Region:           reg,
					},
				},
			},
		})
	}

	rules := make([]SarifRule, 0, len(ruleMap))
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
						Version:        CliVersion,
						InformationURI: "https://github.com/damian-sztankowski/Deployment-Readiness-Auditor",
						Rules:          rules,
					},
				},
				Results: sarifResults,
			},
		},
	}
}

func buildMarkdownReport(report AuditReport, files []string, githubPrMode bool) string {
	var sb strings.Builder
	if githubPrMode {
		sb.WriteString("<!-- dra-sticky-pr-comment -->\n")
	}

	crit, high := 0, 0
	for _, f := range report.Findings {
		if f.Severity == "Critical" {
			crit++
		} else if f.Severity == "High" {
			high++
		}
	}
	verdict := "✅ PRODUCTION READY"
	if crit > 0 {
		verdict = "🚫 DEPLOYMENT BLOCKED"
	} else if high > 0 {
		verdict = "⚠️ CONDITIONAL READINESS"
	}

	sb.WriteString(fmt.Sprintf("# 🛡️ Deployment Readiness Auditor (v%s) — %s\n\n", CliVersion, verdict))
	sb.WriteString(fmt.Sprintf("- **Files Audited:** %d | **Active Findings:** %d (%d Critical, %d High)\n", len(files), len(report.Findings), crit, high))
	if report.FinOps != nil && report.FinOps.PotentialMonthlySavingsUsd > 0 {
		sb.WriteString(fmt.Sprintf("- **FinOps Savings Opportunity:** `$%.2f/mo` (`$%.2f/yr` in `%s`)\n", report.FinOps.PotentialMonthlySavingsUsd, report.FinOps.AnnualSavingsUsd, report.FinOps.Region))
	}
	sb.WriteString(fmt.Sprintf("- **Timestamp:** %s\n\n", time.Now().UTC().Format(time.RFC1123)))

	sb.WriteString("## 📢 Executive Summary\n\n")
	sb.WriteString(report.Summary + "\n\n")

	sb.WriteString("## 📊 Architecture Pillar Scores (Google Cloud Well-Architected)\n\n")
	sb.WriteString("| Status | Pillar | Score | Strategic Evaluation |\n")
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

	if report.Diagram != "" && githubPrMode {
		sb.WriteString("<details>\n<summary><strong>🗺️ View Generated Infrastructure Topology Map (Mermaid)</strong></summary>\n\n")
		sb.WriteString("```mermaid\n" + strings.TrimSpace(report.Diagram) + "\n```\n\n</details>\n\n")
	}

	sb.WriteString("## 🚨 Actionable Findings & Remediations\n\n")
	if len(report.Findings) == 0 {
		sb.WriteString("🎉 **Zero architectural violations detected!**\n")
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
			sb.WriteString(fmt.Sprintf("- **Pillar:** %s | **Location:** `%s:%d`\n", f.Category, f.FileName, f.LineNumber))
			sb.WriteString(fmt.Sprintf("- **Description:** %s\n", f.Description))
			sb.WriteString(fmt.Sprintf("- **Remediation:** %s\n", f.Remediation))
			if f.CostSavings != "" {
				sb.WriteString(fmt.Sprintf("- **FinOps Impact:** `%s`\n", f.CostSavings))
			}
			if len(f.Compliance) > 0 {
				sb.WriteString("- **Compliance Controls:** ")
				parts := make([]string, 0, len(f.Compliance))
				for _, c := range f.Compliance {
					parts = append(parts, fmt.Sprintf("`%s %s`", c.Standard, c.ControlID))
				}
				sb.WriteString(strings.Join(parts, ", ") + "\n")
			}
			if strings.TrimSpace(f.Fix) != "" {
				codeFence := "hcl"
				if githubPrMode {
					sb.WriteString("\n<details><summary>💡 Suggested IaC Remediation</summary>\n\n")
				}
				sb.WriteString("\n```" + codeFence + "\n" + strings.TrimSpace(f.Fix) + "\n```\n")
				if githubPrMode {
					sb.WriteString("\n</details>\n")
				}
			}
			sb.WriteString("\n---\n\n")
		}
	}

	return sb.String()
}

func startSpinner(msg string, done chan struct{}) {
	frames := []string{"⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"}
	i := 0
	for {
		select {
		case <-done:
			return
		default:
			fmt.Fprintf(os.Stderr, "\r\033[K %s %s", frames[i], msg)
			i = (i + 1) % len(frames)
			time.Sleep(90 * time.Millisecond)
		}
	}
}

func drawProgressBar(score int, status string) string {
	width := 20
	filled := int(float64(score) / 100.0 * float64(width))
	if filled < 0 {
		filled = 0
	}
	if filled > width {
		filled = width
	}
	color := Green
	if status == "Critical" {
		color = Red
	} else if status == "Warning" {
		color = Yellow
	}
	return color + strings.Repeat("█", filled) + strings.Repeat("░", width-filled) + Reset
}

func drawBoxedFinding(index int, f Finding) {
	sevIcon := "ℹ️ INFO"
	color := Blue
	switch f.Severity {
	case "Critical":
		sevIcon = "🔴 CRITICAL"
		color = Red
	case "High":
		sevIcon = "🟠 HIGH"
		color = Yellow
	case "Medium":
		sevIcon = "🟡 MEDIUM"
		color = Yellow
	case "Low":
		sevIcon = "🔵 LOW"
	}

	borderWidth := 80
	fmt.Printf("\n%s%s%s\n", color+Bold, strings.Repeat("━", borderWidth), Reset)
	fmt.Printf(" %s%d. [%s] %s (Pillar: %s)%s\n", Bold, index, sevIcon, f.Title, f.Category, Reset)
	fmt.Printf("%s%s%s\n", color, strings.Repeat("─", borderWidth), Reset)
	fmt.Printf("  📍 %-12s: %s (Line %d)\n", "Location", f.FileName, f.LineNumber)
	fmt.Printf("  📝 %-12s: %s\n", "Description", f.Description)
	fmt.Printf("  🔧 %-12s: %s\n", "Remediation", f.Remediation)
	if f.CostSavings != "" {
		fmt.Printf("  💰 %-12s: %s%s%s\n", "FinOps", Green, f.CostSavings, Reset)
	}
	if len(f.Compliance) > 0 {
		fmt.Printf("  📋 %-12s:\n", "Compliance")
		for _, comp := range f.Compliance {
			fmt.Printf("      • %s (%s): %s\n", Bold+comp.Standard+Reset, comp.ControlID, comp.Description)
		}
	}
	if strings.TrimSpace(f.Fix) != "" {
		fmt.Printf("  %s%s%s\n", color, strings.Repeat("┈", borderWidth), Reset)
		fmt.Printf("  💡 %s:\n", Bold+"Suggested IaC Fix"+Reset)
		for _, line := range strings.Split(strings.TrimSpace(f.Fix), "\n") {
			fmt.Printf("      %s%s%s\n", Green, line, Reset)
		}
	}
	fmt.Printf("%s%s%s\n", color+Bold, strings.Repeat("━", borderWidth), Reset)
}

func getMockAuditReport() AuditReport {
	return AuditReport{
		Summary: "Architecture contains high-risk firewall exposures and unattached storage disks violating CIS GCP Benchmark v2.0 controls.",
		Model:   "dra-hybrid-demo-v3",
		Categories: []CategoryScore{
			{Name: "Security & Compliance", Score: 45, Status: "Critical", Explanation: "Ingress firewall open to 0.0.0.0/0 on port 22 and public Cloud Storage bucket without uniform access."},
			{Name: "Cost Optimization", Score: 68, Status: "Warning", Explanation: "Unattached PD-SSD disk incurring reclaimable monthly waste."},
			{Name: "Reliability", Score: 82, Status: "Safe", Explanation: "Compute tier resilient; add bucket versioning for object recovery."},
			{Name: "Operational Excellence", Score: 65, Status: "Warning", Explanation: "Missing resource labels for cost_center and environment."},
			{Name: "Performance Efficiency", Score: 90, Status: "Safe", Explanation: "Appropriate compute machine tier selected."},
		},
		FinOps: &FinOpsSummary{
			Region:                       "us-central1",
			EstimatedCurrentMonthlyUsd:   142.00,
			EstimatedOptimizedMonthlyUsd: 67.00,
			PotentialMonthlySavingsUsd:   75.00,
			AnnualSavingsUsd:             900.00,
		},
		Findings: []Finding{
			{
				ID:          "f1",
				Severity:    "Critical",
				Category:    "Security",
				Title:       "Public Cloud Storage Bucket Without Uniform Access",
				Description: "Storage bucket lacks Uniform Bucket-Level Access (UBLA) and public access prevention.",
				Remediation: "Enable uniform_bucket_level_access = true and public_access_prevention = \"enforced\".",
				Fix:         "uniform_bucket_level_access = true\npublic_access_prevention    = \"enforced\"",
				FileName:    "main.tf",
				LineNumber:  1,
				Source:      "deterministic",
				Compliance: []Compliance{
					{Standard: "CIS GCP Benchmark", ControlID: "CIS 5.1", Description: "Ensure uniform bucket-level access is enabled", Impact: "Unrestricted public exposure of proprietary data"},
					{Standard: "NIST 800-53", ControlID: "AC-3", Description: "Access Enforcement", Impact: "Unauthorized read access"},
				},
			},
			{
				ID:          "f2",
				Severity:    "High",
				Category:    "Security",
				Title:       "Over-Permissive Firewall Rules (SSH 0.0.0.0/0)",
				Description: "Firewall rule allows TCP traffic on port 22 from all IP addresses (0.0.0.0/0).",
				Remediation: "Restrict SSH access to Google Identity-Aware Proxy (35.235.240.0/20).",
				Fix:         "source_ranges = [\"35.235.240.0/20\"]",
				FileName:    "main.tf",
				LineNumber:  14,
				Source:      "deterministic",
				Compliance: []Compliance{
					{Standard: "CIS GCP Benchmark", ControlID: "CIS 3.6", Description: "Ensure SSH access is restricted from the internet", Impact: "Brute-force attacks and network infiltration"},
				},
			},
			{
				ID:          "f3",
				Severity:    "Medium",
				Category:    "Cost Optimization",
				Title:       "Unattached PD-SSD Zombie Disk",
				Description: "Disk is defined as PD-SSD but is not attached to any compute instance.",
				Remediation: "Snapshot and delete unused block storage.",
				CostSavings: "Save ~$75/mo",
				Fix:         "type = \"pd-standard\"",
				FileName:    "main.tf",
				LineNumber:  41,
				Source:      "deterministic",
			},
		},
	}
}

func init() {
	rootCmd.AddCommand(scanCmd)
	rootCmd.AddCommand(versionCmd)

	scanCmd.Flags().StringVarP(&scanPath, "path", "p", ".", "Path to file or directory containing IaC files")
	scanCmd.Flags().StringVarP(&backendURL, "endpoint", "e", "http://localhost:8080/api/audit", "DRA Backend API URL")
	scanCmd.Flags().BoolVarP(&deepScan, "deep-scan", "d", false, "Scan directory and subdirectories recursively")
	scanCmd.Flags().BoolVarP(&autoApprove, "yes", "y", false, "Automatically approve interactive prompts in CI/CD")
	scanCmd.Flags().StringVar(&failOn, "fail-on", "", "Fail with exit code 1 if severity threshold is reached (e.g. 'critical,high')")
	scanCmd.Flags().IntVar(&minScore, "min-score", 0, "Fail with exit code 1 if any pillar score drops below threshold (0-100)")
	scanCmd.Flags().StringVarP(&outputFormat, "output", "o", "console", "Output format: console, json, sarif, markdown, github-pr")
	scanCmd.Flags().StringVar(&outputFile, "output-file", "", "Path to write formatted report output")
	scanCmd.Flags().StringVar(&fixPatchFile, "fix-patch", "", "Path to write verified Git unified patch (.patch)")
	scanCmd.Flags().StringVar(&llmProvider, "llm-provider", "", "Engine provider: gemini, static, ollama, lm-studio")
	scanCmd.Flags().StringVar(&llmModel, "llm-model", "", "LLM Model Name (e.g. gemini-4-hydrogen, gemini-4-carbon, gemini-3.8-flash, gemma4:e2b)")
	scanCmd.Flags().StringVar(&llmURL, "llm-url", "", "Self-hosted LLM Endpoint URL")
	scanCmd.Flags().StringVarP(&authToken, "token", "t", "", "Authorization OIDC Bearer token (or GCP_IAM_TOKEN)")
	scanCmd.Flags().StringVarP(&apiKey, "api-key", "k", "", "DRA Backend API key (or DRA_API_KEY)")
	scanCmd.Flags().BoolVar(&demoMode, "demo", false, "Run simulated offline showcase report")
	scanCmd.Flags().BoolVar(&enableDlp, "dlp", true, "Run bidirectional client-side DLP before transmitting code")
	scanCmd.Flags().BoolVar(&noColor, "no-color", false, "Disable ANSI terminal colors (also respects NO_COLOR)")
	scanCmd.Flags().IntVar(&timeoutSec, "timeout", 120, "HTTP request timeout in seconds")
	scanCmd.Flags().StringVar(&policyPath, "policy", "", "Path to .dra.yaml organization policy & waivers file")
	scanCmd.Flags().BoolVar(&changedOnly, "changed-only", false, "Scan only Git-modified IaC files relative to --base")
	scanCmd.Flags().StringVar(&gitBaseRef, "base", "HEAD~1", "Base Git ref used with --changed-only")
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
