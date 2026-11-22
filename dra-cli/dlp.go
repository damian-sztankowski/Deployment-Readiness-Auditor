package main

import (
	"fmt"
	"regexp"
	"sort"
	"strings"
)

var dlpIgnoreTokens = map[string]bool{
	"0.0.0.0/0":       true,
	"::/0":            true,
	"35.235.240.0/20": true,
	"199.36.153.8/30": true,
	"199.36.153.4/30": true,
	"default":         true,
	"us-central1":     true,
	"us-east1":        true,
	"europe-west1":    true,
	"europe-west3":    true,
	"standard":        true,
	"enforced":        true,
	"true":            true,
	"false":           true,
}

var (
	reGcpApiKey = regexp.MustCompile(`AIzaSy[A-Za-z0-9\-_]{10,45}`)
	rePemKey    = regexp.MustCompile(`(?s)-----BEGIN [A-Z0-9\s]+?PRIVATE KEY-----.*?-----END [A-Z0-9\s]+?PRIVATE KEY-----`)
	reAwsKey    = regexp.MustCompile(`\bAKIA[0-9A-Z]{16}\b`)
	rePatToken  = regexp.MustCompile(`\b(?:ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})\b`)
	reSecretKv  = regexp.MustCompile(`(?i)((?:password|passwd|db_password|secret|client_secret|key_data|private_key|api[_-]?key|token|access_key|auth_token)\s*[:=]\s*["'])([^"'\[]+)(["'])`)
	reEmail     = regexp.MustCompile(`[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}`)
	reIpv4      = regexp.MustCompile(`\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?:/\d{1,2})?\b`)
	reCloudIdKv = regexp.MustCompile(`(?i)((?:project|project_id|org_id|billing_account|folder_id|service_account_id|account_id)\s*[:=]\s*["'])([a-zA-Z0-9\-_.:]{4,128})(["'])`)
	reResNameKv = regexp.MustCompile(`(?i)((?:bucket|bucket_name|database_instance|instance_name|repository_id)\s*[:=]\s*["'])([a-z0-9\-._]{3,128})(["'])`)
	reNetKv     = regexp.MustCompile(`(?i)((?:network|subnetwork|vpc|dns_name|domain_name)\s*[:=]\s*["'])([a-z][a-z0-9.\-]{2,128})(["'])`)
)

type DlpResult struct {
	SanitizedCode  string
	RedactionCount int
	AliasMap       map[string]string
}

// AnonymizeHCL scrubs secrets irreversibly and maps identifiers to reversible semantic aliases locally.
func AnonymizeHCL(code string) DlpResult {
	res := DlpResult{
		SanitizedCode: code,
		AliasMap:      make(map[string]string),
	}
	if strings.TrimSpace(code) == "" {
		return res
	}

	origToAlias := make(map[string]string)
	catCount := make(map[string]int)

	getAlias := func(orig, category string) string {
		trimmed := strings.TrimSpace(orig)
		if trimmed == "" || dlpIgnoreTokens[strings.ToLower(trimmed)] || strings.HasPrefix(trimmed, "[REDACTED") {
			return orig
		}
		key := category + ":" + trimmed
		if existing, ok := origToAlias[key]; ok {
			return existing
		}
		catCount[category]++
		alias := fmt.Sprintf("%s_%d", strings.ToUpper(category), catCount[category])
		origToAlias[key] = alias
		res.AliasMap[alias] = trimmed
		res.RedactionCount++
		return alias
	}

	out := code

	// 1. Non-reversible secrets
	out = reGcpApiKey.ReplaceAllStringFunc(out, func(_ string) string {
		res.RedactionCount++
		return "[REDACTED_GCP_API_KEY]"
	})
	out = rePemKey.ReplaceAllStringFunc(out, func(_ string) string {
		res.RedactionCount++
		return "[REDACTED_PEM_PRIVATE_KEY]"
	})
	out = reAwsKey.ReplaceAllStringFunc(out, func(_ string) string {
		res.RedactionCount++
		return "[REDACTED_AWS_ACCESS_KEY_ID]"
	})
	out = rePatToken.ReplaceAllStringFunc(out, func(_ string) string {
		res.RedactionCount++
		return "[REDACTED_TOKEN_SECRET]"
	})
	out = reSecretKv.ReplaceAllStringFunc(out, func(m string) string {
		sub := reSecretKv.FindStringSubmatch(m)
		if len(sub) == 4 {
			res.RedactionCount++
			return sub[1] + "[REDACTED_SECRET]" + sub[3]
		}
		return m
	})

	// 2. Reversible semantic aliases
	out = reEmail.ReplaceAllStringFunc(out, func(m string) string {
		return getAlias(m, "IDENTITY")
	})
	out = reIpv4.ReplaceAllStringFunc(out, func(m string) string {
		if m == "0.0.0.0" || m == "0.0.0.0/0" || dlpIgnoreTokens[m] {
			return m
		}
		return getAlias(m, "IP_RANGE")
	})

	replaceKv := func(re *regexp.Regexp, text, cat string) string {
		return re.ReplaceAllStringFunc(text, func(m string) string {
			sub := re.FindStringSubmatch(m)
			if len(sub) == 4 {
				return sub[1] + getAlias(sub[2], cat) + sub[3]
			}
			return m
		})
	}

	out = replaceKv(reCloudIdKv, out, "CLOUD_ID")
	out = replaceKv(reResNameKv, out, "RESOURCE_NAME")
	out = replaceKv(reNetKv, out, "NETWORK_TOPOGRAPHY")

	res.SanitizedCode = out
	return res
}

func deanonymizeString(s string, aliasMap map[string]string) string {
	if s == "" || len(aliasMap) == 0 {
		return s
	}
	aliases := make([]string, 0, len(aliasMap))
	for a := range aliasMap {
		aliases = append(aliases, a)
	}
	sort.Slice(aliases, func(i, j int) bool {
		return len(aliases[i]) > len(aliases[j])
	})

	out := s
	for _, a := range aliases {
		out = strings.ReplaceAll(out, a, aliasMap[a])
	}
	return out
}

func DeanonymizeReport(report *AuditReport, aliasMap map[string]string) {
	if report == nil || len(aliasMap) == 0 {
		return
	}
	report.Summary = deanonymizeString(report.Summary, aliasMap)
	report.Diagram = deanonymizeString(report.Diagram, aliasMap)
	for i := range report.Categories {
		report.Categories[i].Explanation = deanonymizeString(report.Categories[i].Explanation, aliasMap)
	}
	for i := range report.Findings {
		report.Findings[i].Title = deanonymizeString(report.Findings[i].Title, aliasMap)
		report.Findings[i].Description = deanonymizeString(report.Findings[i].Description, aliasMap)
		report.Findings[i].Remediation = deanonymizeString(report.Findings[i].Remediation, aliasMap)
		report.Findings[i].Fix = deanonymizeString(report.Findings[i].Fix, aliasMap)
		report.Findings[i].OriginalSnippet = deanonymizeString(report.Findings[i].OriginalSnippet, aliasMap)
		report.Findings[i].FileName = deanonymizeString(report.Findings[i].FileName, aliasMap)
	}
}
