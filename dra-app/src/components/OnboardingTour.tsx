import React, { useEffect } from 'react';
import { driver } from 'driver.js';

interface OnboardingTourProps {
  startTour: boolean;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ startTour }) => {
  useEffect(() => {
    if (!startTour) return;

    const hasSeenTour = localStorage.getItem('dra-has-seen-tour-v3.1');
    if (hasSeenTour) return;

    const driverObj = driver({
      showProgress: true,
      popoverClass: 'driverjs-theme',
      animate: true,
      steps: [
        {
          element: '#input-section-container',
          popover: {
            title: 'Welcome to DRA v3.1 Command Studio',
            description:
              'Audit Terraform, OpenTofu, tfplan.json, GKE YAML, and Dockerfiles with Bidirectional Client-Side DLP and .dra.yaml organization policies.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#action-buttons-group',
          popover: {
            title: 'Multi-Stack Import & Starter Samples',
            description:
              'Upload single files, project directories (including .dra.yaml waivers), or load the built-in Terraform or GKE/Docker starter templates.',
            side: 'left',
            align: 'start'
          }
        },
        {
          element: '#analyze-fab-container',
          popover: {
            title: 'Gemini 4 Frontier & Offline AST Selector',
            description:
              'Pick Gemini 4 Hydrogen (fast default), Gemini 4 Carbon (deep frontier security), Gemini 3.8 Flash, zero-key Offline AST, or local Ollama—then run a live SSE audit.',
            side: 'top',
            align: 'end'
          }
        },
        {
          element: '#header-history-btn',
          popover: {
            title: 'Audit History & Drift Deltas',
            description:
              'Compare any past scan as a baseline to track maturity score gains and resolved critical blockers.',
            side: 'bottom',
            align: 'end'
          }
        },
        {
          element: '#header-theme-btn',
          popover: {
            title: 'Alabaster Light & Obsidian Dark Themes',
            description:
              'Toggle between perceptually balanced OKLCH light and dark studio workspaces.',
            side: 'bottom',
            align: 'end'
          }
        }
      ],
      onDestroyed: () => {
        localStorage.setItem('dra-has-seen-tour-v3.1', 'true');
      }
    });

    const timer = setTimeout(() => {
      driverObj.drive();
    }, 800);

    return () => clearTimeout(timer);
  }, [startTour]);

  return null;
};
