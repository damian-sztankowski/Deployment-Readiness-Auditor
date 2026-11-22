import React, { useEffect } from 'react';
import { driver } from 'driver.js';

interface OnboardingTourProps {
  startTour: boolean;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ startTour }) => {
  useEffect(() => {
    if (!startTour) return;

    const hasSeenTour = localStorage.getItem('dra-has-seen-tour-v3');
    if (hasSeenTour) return;

    const driverObj = driver({
      showProgress: true,
      popoverClass: 'driverjs-theme',
      animate: true,
      steps: [
        {
          element: '#input-section-container',
          popover: {
            title: 'Welcome to DRA v3.0',
            description:
              'Audit Terraform, OpenTofu, tfplan.json, GKE YAML, and Dockerfiles with Bidirectional Client-Side DLP and optional .dra.yaml org policies.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#action-buttons-group',
          popover: {
            title: 'Multi-Stack Import & Examples',
            description:
              'Upload single files, entire project folders (including .dra.yaml waivers), or click "Load Example" to inspect a sample specification.',
            side: 'left',
            align: 'start'
          }
        },
        {
          element: '#code-editor-area',
          popover: {
            title: 'Line-Anchored Code & Policy Editor',
            description:
              'Synchronized line numbers let you click any finding card later to jump straight to the offending resource block.',
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '#analyze-fab-container',
          popover: {
            title: 'Hybrid AST + AI Engine',
            description:
              'Open Settings to choose Hybrid Gemini 2.5 + AST, zero-key Offline Deterministic AST, or local Ollama/LM Studio—then click Run Audit for live SSE streaming.',
            side: 'top',
            align: 'end'
          }
        },
        {
          element: '#header-history-btn',
          popover: {
            title: 'Audit History & Drift Deltas',
            description:
              'Compare any historical run as a baseline to track maturity score improvements and resolved critical blockers.',
            side: 'bottom',
            align: 'end'
          }
        },
        {
          element: '#header-theme-btn',
          popover: {
            title: 'Adaptive Light / Dark Theme',
            description: 'Switch seamlessly between obsidian dark and high-contrast light modes.',
            side: 'bottom',
            align: 'end'
          }
        }
      ],
      onDestroyed: () => {
        localStorage.setItem('dra-has-seen-tour-v3', 'true');
      }
    });

    const timer = setTimeout(() => {
      driverObj.drive();
    }, 800);

    return () => clearTimeout(timer);
  }, [startTour]);

  return null;
};
