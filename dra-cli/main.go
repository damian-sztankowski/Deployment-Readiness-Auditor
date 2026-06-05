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
}

// --- CLI FLAGS ---
var scanPath string
var backendURL string
var deepScan bool
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
		fmt.Println(Bold + Blue + "====================================================" + Reset)
		fmt.Println(Bold + "     Deployment Readiness Auditor (DRA) CLI         " + Reset)
		fmt.Println(Bold + Blue + "====================================================" + Reset)

		gcpToken := os.Getenv("GCP_IAM_TOKEN")
		isLocal := strings.Contains(backendURL, "localhost") || strings.Contains(backendURL, "127.0.0.1")
		if gcpToken == "" {
			if !isLocal {
				fmt.Println(Red + "❌ Error: Missing authorization token in GCP_IAM_TOKEN environment variable." + Reset)
				fmt.Println("Please run: export GCP_IAM_TOKEN=$(gcloud auth print-identity-token)")
				return
			} else {
				fmt.Println(Yellow + "ℹ️  No GCP_IAM_TOKEN set. Proceeding without authorization header for local endpoint." + Reset)
			}
		}

		var targetFiles []string

		// --- FILE COLLECTION LOGIC ---
		if deepScan {
			fmt.Print(Yellow + "⚠️  WARNING: Deep scan will analyze all subdirectories.\nThis may consume significant AI token quota. Continue? [y/N]: " + Reset)
			reader := bufio.NewReader(os.Stdin)
			response, _ := reader.ReadString('\n')
			response = strings.TrimSpace(strings.ToLower(response))
			if response != "y" && response != "yes" {
				fmt.Println(Red + "🛑 Scan aborted by user." + Reset)
				return
			}
			fmt.Println("🕵️  Running deep scan...")

			err := filepath.WalkDir(scanPath, func(path string, d os.DirEntry, err error) error {
				if err != nil {
					return err
				}
				if d.IsDir() && strings.HasPrefix(d.Name(), ".") && d.Name() != "." {
					return filepath.SkipDir
				}
				if !d.IsDir() && strings.HasSuffix(d.Name(), ".tf") {
					targetFiles = append(targetFiles, path)
				}
				return nil
			})
			if err != nil {
				fmt.Printf(Red+"❌ Error during deep scan: %v\n"+Reset, err)
				return
			}
		} else {
			files, err := os.ReadDir(scanPath)
			if err != nil {
				fmt.Printf(Red+"❌ Error reading directory '%s': %v\n"+Reset, scanPath, err)
				return
			}
			for _, file := range files {
				if !file.IsDir() && strings.HasSuffix(file.Name(), ".tf") {
					targetFiles = append(targetFiles, filepath.Join(scanPath, file.Name()))
				}
			}
		}

		if len(targetFiles) == 0 {
			fmt.Printf(Yellow+"⚠️  No .tf files found in directory '%s'.\n"+Reset, scanPath)
			return
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
				fmt.Printf(Red+"❌ Error opening file %s: %v\n"+Reset, path, err)
				return
			}

			content, err := io.ReadAll(localFile)
			localFile.Close()
			if err != nil {
				fmt.Printf(Red+"❌ Error reading file content: %v\n"+Reset, err)
				return
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
			fmt.Printf(Red+"❌ Error encoding JSON payload: %v\n"+Reset, err)
			return
		}

		fmt.Printf("📦 Found %d file(s). Transmitting payload to DRA Engine:\n-> %s... 🚀\n", len(targetFiles), backendURL)
		req, err := http.NewRequest("POST", backendURL, bytes.NewBuffer(jsonData))
		if err != nil {
			fmt.Printf(Red+"❌ Error creating HTTP request: %v\n"+Reset, err)
			return
		}

		req.Header.Set("Content-Type", "application/json")
		if gcpToken != "" {
			req.Header.Set("Authorization", "Bearer "+gcpToken)
		}

		// Start terminal loading spinner
		doneSpinner := make(chan struct{})
		go startSpinner("Auditing HCL topology and verifying compliance mapping...", doneSpinner)

		client := &http.Client{}
		resp, err := client.Do(req)

		// Stop loading spinner
		close(doneSpinner)
		fmt.Print("\r\033[K") // Clear spinner line

		if err != nil {
			fmt.Printf(Red+"❌ Error connecting to DRA backend: %v\n"+Reset, err)
			return
		}
		defer resp.Body.Close()

		respBody, err := io.ReadAll(resp.Body)
		if err != nil {
			fmt.Printf(Red+"❌ Error reading response: %v\n"+Reset, err)
			return
		}

		if resp.StatusCode != 200 {
			fmt.Printf(Red+"❌ Server returned error [Status: %s]: %s\n"+Reset, resp.Status, string(respBody))
			return
		}

		var report AuditReport
		err = json.Unmarshal(respBody, &report)
		if err != nil {
			fmt.Printf(Red+"❌ Error decoding JSON response: %v\n"+Reset, err)
			return
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
	},
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
		
		// 1. Colorize types (string, bool, etc)
		processedLine = strings.ReplaceAll(processedLine, " string ", " "+Blue+"string"+Reset+" ")
		processedLine = strings.ReplaceAll(processedLine, " bool ", " "+Blue+"bool"+Reset+" ")
		
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
