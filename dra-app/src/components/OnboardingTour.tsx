import React, { useEffect } from 'react';
import { driver } from 'driver.js';

interface OnboardingTourProps {
  startTour: boolean;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ startTour }) => {
  useEffect(() => {
    if (!startTour) return;

    // Check localStorage to see if user has already seen the tour
    const hasSeenTour = localStorage.getItem('dra-has-seen-tour');
    if (hasSeenTour) return;

    const driverObj = driver({
      showProgress: true,
      popoverClass: 'driverjs-theme', // Custom class defined in index.html for dark mode
      animate: true,
      steps: [
        {
          element: '#input-section-container',
          popover: {
            title: 'Welcome to DRA',
            description: 'This is your workspace. Paste your Terraform/JSON code here or use the file upload tools.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#action-buttons-group',
          popover: {
            title: 'Import Options',
            description: 'You can upload single files or entire folders. Click "Load Example" to see a demo analysis.',
            side: 'left',
            align: 'start'
          }
        },
        {
          element: '#code-editor-area',
          popover: {
            title: 'Code Editor',
            description: 'Your code appears here. You can edit it manually before running the audit.',
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '#analyze-fab-container',
          popover: {
            title: 'Run Analysis',
            description: 'Once you are ready, hit this button. The AI will audit your infrastructure against the Google Cloud Architecture Framework.',
            side: 'top',
            align: 'end'
          }
        },
        {
            element: '#header-history-btn',
            popover: {
              title: 'Audit History',
              description: 'Access your previous scans here. History is saved locally in your browser.',
              side: 'bottom',
              align: 'end'
            }
        },
        {
            element: '#header-theme-btn',
            popover: {
              title: 'Dark Mode',
              description: 'Toggle between light and dark themes to suit your preference.',
              side: 'bottom',
              align: 'end'
            }
        }
      ],
      onDestroyed: () => {
        // Mark as seen when tour is skipped or finished
        localStorage.setItem('dra-has-seen-tour', 'true');
      }
    });

    // Small delay to ensure DOM is fully ready after splash screen exit
    setTimeout(() => {
        driverObj.drive();
    }, 1000);

  }, [startTour]);

  return null; // This component does not render any visible UI itself
};