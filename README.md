# Helix - Chrome Extension for Automated Userscript Generation

## Overview

Helix is a Chrome extension that makes use of the Gemini API to automatically generate userscripts based on user prompts.

## Requirements

-   **Gemini API Key**: You will need a Gemini API key. Obtain your key by signing up for the Gemini API service.

## Installation

### 1. Clone the Repository

Clone this repository to your local machine using the following command:

```bash
git clone https://github.com/rubberduckit/helix.git
```

and build the exntension 

```bash
npm run build
```

### 2. Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable "Developer mode" using the toggle in the top-right corner.
3. Click on "Load unpacked" and select the directory where you cloned the repository.

### 3. Using the Extension

1. Click on the Helix icon in your Chrome toolbar to open the sidebar.
2. Enter your prompt describing the result you want e.g. "Add a button that scrolls to the top".
3. Helix will process your input and generate the corresponding userscript using the Gemini API.
4. The script will be injected and executed on the active web page after you click run.
5. Don't like a script Helix has made? tell it the issues and it will iterate over them!

## Troubleshooting

1. **I can't acces Gemini 2.5 flash lite**
- Make sure that you have billing enabled in order to use Gemini.

2. **The script didn't do anything:**
- Sometimes a script will fail due to network or API provider issues - ending the request early is a common one
