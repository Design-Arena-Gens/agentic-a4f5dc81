# Speed Latest Video Navigator (Chrome Extension)

This Chrome extension automates the journey to IShowSpeed's latest YouTube upload. With a single click, it opens YouTube in the current tab, locates the official channel, navigates to the Videos tab (sorted by newest), and launches the most recent video. The popup provides accessible controls, clear feedback, and a confirmation message after successful navigation.

## Installation

1. Download or clone this repository to your local machine.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (toggle in the top right).
4. Click **Load unpacked** and choose this project directory.
5. The extension icon (stylized red/black "S") should now appear in the toolbar.

## Usage

1. Click the extension icon to open the popup.
2. Activate the **Go to Speed's Last Video** button (mouse, keyboard Enter/Space, or screen reader).
3. The current tab will:
   - Open YouTube search results filtered for the IShowSpeed channel.
   - Navigate to the channel's Videos tab sorted by newest.
   - Open the most recent upload.
4. The popup displays status updates and a brief confirmation message upon success. Errors (e.g., channel or video not found) are reported with clear messaging.

## Accessibility

- Visible focus ring and keyboard activation on the primary button.
- Live region for status updates to announce success or failure.
- High-contrast styling for popup elements.

## Project Structure

```
.
├─ extension/
│  ├─ manifest.json    # Extension configuration (Manifest V3)
│  ├─ background.js    # Service worker orchestrating navigation
│  ├─ popup.html       # Popup markup
│  ├─ popup.css        # Popup styling
│  ├─ popup.js         # Popup logic and messaging
│  └─ icons/           # Extension icons (red/black stylized "S")
└─ index.html          # Landing page with installation steps (for Vercel deploy)
```

## Troubleshooting

- If YouTube changes its layout, the DOM selectors in `background.js` may need updates.
- Navigation waits up to 30 seconds for each page load. Slow networks could trigger the timeout; retry the button if that happens.
- The extension requires permission to run scripts on `youtube.com`. Ensure the permission prompt is accepted when loading the unpacked extension.

## License

This project is released under the MIT License.
