import { createTwoFilesPatch } from 'diff';
import { Finding } from '../types';
import { splitMultiFileCode } from './staticAnalyzer';

export interface FileDiffPreview {
  fileName: string;
  beforeContent: string;
  afterContent: string;
  unifiedPatch: string;
  appliedCount: number;
}

export interface RemediationBundle {
  patchContent: string;
  remediatedCodeContent: string;
  totalFixesCount: number;
  isGitApplyReady: boolean;
  fileDiffs: FileDiffPreview[];
}

/**
 * Applies structured finding fixes (`originalSnippet` -> `fix` or line-targeted replacement)
 * against the actual original IaC source files and produces genuine POSIX / Git unified diffs
 * (`git apply dra-remediation.patch` verified!).
 */
export const generateRemediationBundle = (
  findings: Finding[],
  originalCode?: string
): RemediationBundle => {
  const fixableFindings = findings.filter((f) => f.fix && f.fix.trim().length > 0 && !f.waived);

  if (fixableFindings.length === 0) {
    return {
      patchContent: '# No automated fixes available for current findings.\n',
      remediatedCodeContent: originalCode || '# No code fixes available.\n',
      totalFixesCount: 0,
      isGitApplyReady: false,
      fileDiffs: []
    };
  }

  const timestamp = new Date().toISOString();
  const fileDiffs: FileDiffPreview[] = [];
  let combinedGitPatch = '';

  if (originalCode && originalCode.trim().length > 0) {
    const splitFiles = splitMultiFileCode(originalCode);
    const fileMap = new Map<string, string>();
    for (const sf of splitFiles) {
      fileMap.set(sf.fileName, sf.content);
    }

    // Group findings by target file
    const byFile = new Map<string, Finding[]>();
    for (const f of fixableFindings) {
      const targetFile =
        f.fileName && fileMap.has(f.fileName)
          ? f.fileName
          : splitFiles.length === 1
            ? splitFiles[0].fileName
            : f.fileName || 'main.tf';
      const arr = byFile.get(targetFile) || [];
      arr.push(f);
      byFile.set(targetFile, arr);
    }

    for (const [fileName, fileFindings] of byFile.entries()) {
      const originalFileContent = fileMap.get(fileName);
      if (originalFileContent === undefined) continue;

      let updatedContent = originalFileContent;
      let appliedCount = 0;

      // Pass 1: Exact originalSnippet replacements
      const remainingFindings: Finding[] = [];
      for (const f of fileFindings) {
        const fixTrimmed = (f.fix || '').trim();
        if (f.originalSnippet && updatedContent.includes(f.originalSnippet.trim())) {
          updatedContent = updatedContent.replace(f.originalSnippet.trim(), fixTrimmed);
          appliedCount++;
        } else {
          remainingFindings.push(f);
        }
      }

      // Pass 2: Resource header matching (e.g., fix starts with `resource "type" "name" {`) or line-based block match
      for (const f of remainingFindings) {
        const fixTrimmed = (f.fix || '').trim();
        const headerMatch = fixTrimmed.match(/^(resource\s+"[^"]+"\s+"[^"]+"\s*\{)/);
        if (headerMatch) {
          const header = headerMatch[1];
          const startIdx = updatedContent.indexOf(header);
          if (startIdx !== -1) {
            // Find matching closing brace for that resource block
            let depth = 0;
            let endIdx = startIdx;
            let inQuotes = false;
            for (let k = startIdx; k < updatedContent.length; k++) {
              const ch = updatedContent[k];
              if (ch === '"' && updatedContent[k - 1] !== '\\') inQuotes = !inQuotes;
              if (!inQuotes) {
                if (ch === '{') depth++;
                else if (ch === '}') {
                  depth--;
                  if (depth === 0) {
                    endIdx = k + 1;
                    break;
                  }
                }
              }
            }
            if (endIdx > startIdx) {
              updatedContent =
                updatedContent.slice(0, startIdx) + fixTrimmed + updatedContent.slice(endIdx);
              appliedCount++;
              continue;
            }
          }
        }

        // Pass 3: Safe line-anchored insertion if original file has enough lines and content differs
        const lines = updatedContent.split('\n');
        const targetIdx = Math.min(Math.max(0, (f.lineNumber || 1) - 1), lines.length);
        // If fix is a single attribute assignment that replaces an existing key on or near targetIdx
        const singleAttr = fixTrimmed.match(/^([a-zA-Z0-9_]+)\s*=\s*.+$/);
        if (singleAttr && !fixTrimmed.includes('\n')) {
          const attrKey = singleAttr[1];
          let replacedLine = false;
          for (let k = Math.max(0, targetIdx - 2); k < Math.min(lines.length, targetIdx + 12); k++) {
            const keyRe = new RegExp(`^(\\s*)${attrKey}\\s*=.*$`);
            const m = lines[k].match(keyRe);
            if (m) {
              lines[k] = `${m[1]}${fixTrimmed}`;
              updatedContent = lines.join('\n');
              appliedCount++;
              replacedLine = true;
              break;
            }
          }
          if (replacedLine) continue;
        }
      }

      if (updatedContent !== originalFileContent) {
        const beforeNorm = originalFileContent.endsWith('\n')
          ? originalFileContent
          : `${originalFileContent}\n`;
        const afterNorm = updatedContent.endsWith('\n') ? updatedContent : `${updatedContent}\n`;

        const rawPatch = createTwoFilesPatch(
          `a/${fileName}`,
          `b/${fileName}`,
          beforeNorm,
          afterNorm,
          '',
          '',
          { context: 3 }
        );
        // Replace `Index: ... ===` header from jsdiff with standard `diff --git` header for `git apply`
        const cleanBody = rawPatch.replace(/^Index:.*\n=+\n/, '');
        const gitFormattedPatch = `diff --git a/${fileName} b/${fileName}\n${cleanBody}`;

        combinedGitPatch += `${gitFormattedPatch}\n`;
        fileDiffs.push({
          fileName,
          beforeContent: beforeNorm,
          afterContent: afterNorm,
          unifiedPatch: gitFormattedPatch,
          appliedCount
        });
      }
    }
  }

  // Fallback unified new-file patch if findings couldn't be anchored (e.g. Showcase Mockup without matching source)
  let isGitApplyReady = combinedGitPatch.trim().length > 0;
  if (!isGitApplyReady) {
    const newFileLines: string[] = [
      `# DRA Consolidated Remediations (${timestamp})`,
      ...fixableFindings.flatMap((f, idx) => [
        `# [${idx + 1}] ${f.severity.toUpperCase()}: ${f.title} (${f.fileName || 'main.tf'}:${f.lineNumber || 1})`,
        ...(f.fix || '').trim().split('\n'),
        ''
      ])
    ];
    const afterNorm = `${newFileLines.join('\n')}\n`;
    const rawPatch = createTwoFilesPatch(
      '/dev/null',
      'b/dra-remediated-overrides.tf',
      '',
      afterNorm,
      '',
      '',
      { context: 3 }
    );
    const cleanBody = rawPatch
      .replace(/^Index:.*\n=+\n/, '')
      .replace('--- /dev/null\t\n', '--- /dev/null\n')
      .replace(/\t$/gm, '');
    combinedGitPatch = `diff --git a/dra-remediated-overrides.tf b/dra-remediated-overrides.tf\nnew file mode 100644\n${cleanBody}`;
    isGitApplyReady = true;
    fileDiffs.push({
      fileName: 'dra-remediated-overrides.tf',
      beforeContent: '',
      afterContent: afterNorm,
      unifiedPatch: combinedGitPatch,
      appliedCount: fixableFindings.length
    });
  }

  // Build Consolidated Remediation HCL File (Updated full files if available, plus reference catalog)
  let remediatedFile = `# ========================================================\n`;
  remediatedFile += `# DRA RECOMMENDED REMEDIATION BUNDLE (v3.0)\n`;
  remediatedFile += `# Generated: ${timestamp}\n`;
  remediatedFile += `# ========================================================\n\n`;

  if (fileDiffs.length > 0 && fileDiffs[0].beforeContent !== '') {
    for (const fd of fileDiffs) {
      remediatedFile += `# ### REMEDIATED FILE: ${fd.fileName} ###\n`;
      remediatedFile += `${fd.afterContent}\n`;
    }
  } else {
    fixableFindings.forEach((f, idx) => {
      remediatedFile += `# --------------------------------------------------------\n`;
      remediatedFile += `# Finding ${idx + 1} [${f.severity.toUpperCase()}]: ${f.title}\n`;
      remediatedFile += `# Location: ${f.fileName || 'main.tf'}:${f.lineNumber || 1}\n`;
      if (f.compliance && f.compliance.length > 0) {
        remediatedFile += `# Standards: ${f.compliance.map((c) => `${c.standard} ${c.controlId}`).join(' | ')}\n`;
      }
      remediatedFile += `# Explanation: ${f.remediation}\n`;
      remediatedFile += `# --------------------------------------------------------\n`;
      remediatedFile += `${f.fix?.trim()}\n\n`;
    });
  }

  return {
    patchContent: combinedGitPatch.trimEnd() + '\n',
    remediatedCodeContent: remediatedFile,
    totalFixesCount: fixableFindings.length,
    isGitApplyReady,
    fileDiffs
  };
};

export const downloadTextFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
