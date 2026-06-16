 # Copilot Tips & Tricks

A concise reference to get the most out of GitHub Copilot when coding, writing docs, or reviewing changes.

## 1. Shape output with focused prompts
- Start with a short intent line: `// Goal: parse CSV, dedupe rows, return JSON`
- Give constraints (language, libs, complexity): `Use Python 3.11, pandas, O(n)`.
- Ask for variants: "Give 2 alternatives (simple, optimized)".

## 2. Use comments to guide generation
- Write an example or a docstring first; then trigger completion.
- Use TODO comments to request specific helper functions.

## 3. Iterate—refine suggestions
- Accept partial suggestions and edit; then ask for improvements:
  - "Refactor for readability"
  - "Add unit tests for edge cases"

## 4. Prompt for tests and examples
- Ask Copilot to generate unit tests and example usage alongside code.
- Request edge-case tests (nulls, empty inputs, large inputs).

## 5. Code reviews and explanations
- Paste a function and request: "Explain potential bugs and security issues".
- Ask for complexity analysis and alternate implementations.

## 6. Use in pull requests and commits
- Request concise PR descriptions and atomic commit message suggestions.
- Ask for a changelog entry based on diff text.

## 7. Keyboard/IDE habits
- Trigger completions after writing a signature/comment to get focused suggestions.
- Accept suggestions in small chunks, not whole files, to keep control.

## 8. Safety, licensing & secrets
- Do not paste secrets or credentials; ask Copilot to redact or replace placeholders.
- Verify and test generated code — Copilot can suggest copyrighted code from training data; prefer short snippets and review licenses.

## 9. Configuration & personalization
- Adjust model and suggestion settings in your editor to change frequency/verbosity.
- Add project-specific docstrings or README details to the repo to improve context-aware completions.

## 10. Productivity patterns
- Use Copilot for repetitive scaffolding (CRUD, infra templates) and then refactor.
- Ask for TODO lists, implementation plans, or checklists before large refactors.

## Example prompt patterns
- "Write a TypeScript function that validates emails and returns typed error messages. Include unit tests (Jest)."
- "Refactor this method to be more functional and add comments explaining each step."

## Troubleshooting
- If suggestions feel off, provide a minimal reproducible example and ask again.
- Narrow context: remove unrelated code before asking for targeted changes.

## Final advice
Treat Copilot as a helpful collaborator: accept useful suggestions, verify correctness, test thoroughly, and keep prompts explicit and scoped for best results.

## Useful Shortcuts
Shortcuts vary by editor and OS—use the Command Palette / Find Action to confirm or rebind keys (VS Code: Ctrl+Shift+P, JetBrains: Ctrl+Shift+A).

Common actions (Windows keys shown; macOS replaces Ctrl with ⌘ and Alt with Option):
- Accept inline suggestion: Tab or Right Arrow
- Cycle suggestions / view alternatives: use the editor Copilot commands via Command Palette (common mappings vary)
- Trigger suggestion manually: Ctrl+Space (editor suggestion) or the Copilot command in the palette
- Open Copilot chat/panel or show more suggestions: search "Copilot" in Command Palette and run the desired command
- Toggle Copilot on/off: find "Enable/Disable GitHub Copilot" in the Command Palette or use your editor's extensions/settings

Tips:
- If unsure of a keybinding, open the Command Palette and search for "Copilot" to see available commands and their shortcuts.
- Rebind frequently used Copilot commands to your preferred keys for faster flow.

