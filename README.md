---

# Semi Form Fill Automation Script

A Node.js + Playwright based automation tool that helps streamline repetitive workflows on the portals.
It automates form filling, handles login with saved credentials, and manages IDs with a smart queue system.

## Features

- Login persistence using auth.json (no need to re-login every time).
- Reads IDs from ids.txt.
- Opens each ID in a new tab (full-screen).
- Pre-fills common form fields automatically.
- Pauses so you can manually review/edit before submitting.
- After submission & tab close:
-- Moves processed ID from ids.txt → ids_done.txt.
-- Automatically continues with the next ID.
-- Fully automated using Playwright.

## Tech Stack

- Node.js – runtime
- Playwright – browser automation
- TypeScript / JavaScript – scripting
- File System (fs) – ID management

## Project Structure

automation/
├── script.js        # Main automation script
├── ids.txt          # Input: pending IDs
├── ids_done.txt     # Output: processed IDs
├── auth.json        # Saved login state
└── package.json

## Setup & Usage

- Clone this repository.
- cd semi-form-fill-automation
- Install dependencies.
- Save your login session (only once).
- Add IDs to ids.txt
- Run the script (npm run start).

## Workflow

- Script opens the first ID in a new tab (full screen).
- Form fields auto-fill.
- You review → submit → close tab.
- Script moves that ID to ids_done.txt and opens the next one.

## Deployment

This is a local automation script. No deployment needed — just run it with Node.js on your system.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Made with ❤️ by Tiger

---