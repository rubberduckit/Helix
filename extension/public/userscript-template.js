// Helix Userscript Template
// This file can be injected into web pages without CSP violations

(function() {
  'use strict';
  
  // Your userscript code goes here
  console.log('Helix userscript loaded successfully!');
  
  // Example: Modify the page
  function modifyPage() {
    // Change page title
    document.title = 'Modified by Helix - ' + document.title;
    
    // Add visual indicator
    const indicator = document.createElement('div');
    indicator.id = 'helix-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 999999;
      cursor: pointer;
      transition: all 0.3s ease;
    `;
    indicator.textContent = '🚀 Helix Active';
    
    // Add hover effect
    indicator.addEventListener('mouseenter', () => {
      indicator.style.transform = 'scale(1.05)';
      indicator.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
    });
    
    indicator.addEventListener('mouseleave', () => {
      indicator.style.transform = 'scale(1)';
      indicator.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });
    
    // Remove on click
    indicator.addEventListener('click', () => {
      indicator.remove();
    });
    
    document.body.appendChild(indicator);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.remove();
      }
    }, 5000);
  }
  
  // Execute the modification
  modifyPage();
  
  // Return success message
  return 'Helix userscript executed successfully!';
})();
