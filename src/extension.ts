import {
  Range,
  window,
  Position,
  workspace,
  SnippetString,
  ExtensionContext,
} from "vscode";

export function activate(context: ExtensionContext) {
  let disposable = workspace.onDidChangeTextDocument((event) => {
    if (
      ["javascriptreact", "typescriptreact"].includes(event.document.languageId)
    ) {
      const editor = window.activeTextEditor;
      if (!editor) {
        return;
      }

      for (const change of event.contentChanges) {
        if (change.text === "=") {
          const position = change.range.start;
          const line = event.document.lineAt(position.line);
          const lineText = line.text;

          let startOfPropName = position.character - 1;
          while (
            startOfPropName >= 0 &&
            /[a-zA-Z0-9_-]/.test(lineText[startOfPropName])
          ) {
            startOfPropName--;
          }
          startOfPropName++;

          if (startOfPropName < position.character) {
            if (isInStringLiteral(lineText, position.character)) {
              continue;
            }

            // Use a SnippetString to insert the braces.
            const snippet = new SnippetString("{$0}"); // $0 is the final cursor position

            editor
              .insertSnippet(
                snippet,
                new Position(position.line, position.character + 1)
              )
              .then((success) => {
                if (!success) {
                  console.error("Snippet insertion failed!"); // Add error handling
                }
              });

            // No need to manually move the cursor; the snippet handles it.
          }
        } else if (change.text === "" && change.rangeLength === 1) {
          // Backspace pressed
          const position = change.range.start;
          const line = event.document.lineAt(position.line);
          const charBefore = line.text.substring(
            position.character - 1,
            position.character
          );
          const charAfter = line.text.substring(
            position.character,
            position.character + 1
          );

          if (charBefore === "{" && charAfter === "}") {
            // Remove both braces
            editor.edit((editBuilder) => {
              editBuilder.delete(
                new Range(
                  position.line,
                  position.character - 1,
                  position.line,
                  position.character + 1
                )
              );
            });
          }
        }
      }
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}

function isInStringLiteral(lineText: string, index: number): boolean {
  let inSingleQuoteString = false;
  let inDoubleQuoteString = false;

  for (let i = 0; i < index; i++) {
    if (lineText[i] === "'" && (i === 0 || lineText[i - 1] !== "\\")) {
      inSingleQuoteString = !inSingleQuoteString;
    } else if (lineText[i] === '"' && (i === 0 || lineText[i - 1] !== "\\")) {
      inDoubleQuoteString = !inDoubleQuoteString;
    }
  }
  return inSingleQuoteString || inDoubleQuoteString;
}
