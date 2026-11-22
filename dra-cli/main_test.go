package main

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

func TestBidirectionalDLP(t *testing.T) {
	hcl := `
provider "google" {
  project = "corp-prod-999"
}
resource "google_compute_firewall" "ssh" {
  network = "banking-vpc"
  metadata = {
    owner = "secops@bank.com"
    api_key = "AIzaSyD-TestSecretKeyValue1234567890"
  }
  source_ranges = ["0.0.0.0/0", "34.120.10.5"]
}`

	res := AnonymizeHCL(hcl)
	if strings.Contains(res.SanitizedCode, "corp-prod-999") {
		t.Fatalf("expected project ID to be aliased, got:\n%s", res.SanitizedCode)
	}
	if strings.Contains(res.SanitizedCode, "AIzaSyD-TestSecret") {
		t.Fatalf("expected GCP API key to be scrubbed")
	}
	if !strings.Contains(res.SanitizedCode, "0.0.0.0/0") {
		t.Fatalf("expected 0.0.0.0/0 CIDR to remain intact for firewall auditing")
	}

	rep := AuditReport{
		Summary: "Project CLOUD_ID_1 in NETWORK_TOPOGRAPHY_1 owned by IDENTITY_1",
		Findings: []Finding{
			{
				Title: "Firewall open in NETWORK_TOPOGRAPHY_1",
				Fix:   `network = "NETWORK_TOPOGRAPHY_1"`,
			},
		},
	}
	DeanonymizeReport(&rep, res.AliasMap)
	if !strings.Contains(rep.Summary, "corp-prod-999") || !strings.Contains(rep.Summary, "banking-vpc") {
		t.Fatalf("expected aliases restored in summary, got: %s", rep.Summary)
	}
	if rep.Findings[0].Fix != `network = "banking-vpc"` {
		t.Fatalf("expected fix alias restored, got: %s", rep.Findings[0].Fix)
	}
}

func TestBuildSarifReport(t *testing.T) {
	mock := getMockAuditReport()
	sarif := buildSarifReport(mock)
	if sarif.Version != "2.1.0" {
		t.Fatalf("unexpected SARIF version: %s", sarif.Version)
	}
	if len(sarif.Runs) != 1 || sarif.Runs[0].Tool.Driver.InformationURI != "https://github.com/damian-sztankowski/Deployment-Readiness-Auditor" {
		t.Fatalf("expected canonical repository InformationURI")
	}
	if len(sarif.Runs[0].Results) != len(mock.Findings) {
		t.Fatalf("expected %d SARIF results, got %d", len(mock.Findings), len(sarif.Runs[0].Results))
	}
}

func TestBuildVerifiedGitPatchAppliesWithGitApply(t *testing.T) {
	tmpDir := t.TempDir()
	origTf := `resource "google_compute_firewall" "allow_ssh" {
  name    = "allow-ssh"
  network = "default"
  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
  source_ranges = ["0.0.0.0/0"]
}
`
	tfPath := filepath.Join(tmpDir, "main.tf")
	if err := os.WriteFile(tfPath, []byte(origTf), 0644); err != nil {
		t.Fatal(err)
	}

	report := AuditReport{
		Findings: []Finding{
			{
				ID:              "det-fw-1",
				Severity:        "Critical",
				Title:           "Open SSH",
				FileName:        "main.tf",
				LineNumber:      1,
				OriginalSnippet: strings.TrimSpace(origTf),
				Fix:             strings.ReplaceAll(strings.TrimSpace(origTf), "0.0.0.0/0", "35.235.240.0/20"),
			},
		},
	}

	patch := BuildVerifiedGitPatch(report, tmpDir)
	patchPath := filepath.Join(tmpDir, "remediation.patch")
	if err := os.WriteFile(patchPath, []byte(patch), 0644); err != nil {
		t.Fatal(err)
	}

	cmd := exec.Command("git", "apply", "--check", "remediation.patch")
	cmd.Dir = tmpDir
	if out, err := cmd.CombinedOutput(); err != nil {
		t.Fatalf("git apply --check failed: %v\nOutput: %s\nPatch:\n%s", err, string(out), patch)
	}
}

func TestQualityGateEvaluation(t *testing.T) {
	mock := getMockAuditReport()
	failures := evaluateQualityGate(mock, "critical,high", 70, 1, 1, 1, 0)
	if len(failures) < 3 {
		t.Fatalf("expected critical, high, and min-score gate failures, got: %v", failures)
	}
}

func TestGithubPrMarkdownOutput(t *testing.T) {
	mock := getMockAuditReport()
	mock.Diagram = "flowchart TD\n  A --> B"
	md := buildMarkdownReport(mock, []string{"main.tf"}, true)
	if !strings.Contains(md, "<!-- dra-sticky-pr-comment -->") {
		t.Fatalf("missing sticky PR comment marker")
	}
	if !strings.Contains(md, "```mermaid") {
		t.Fatalf("missing collapsible mermaid diagram in GitHub PR mode")
	}
}
