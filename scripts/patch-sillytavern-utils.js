import fs from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'node_modules/sillytavern-utils-lib/dist/config.js');

fs.readFile(configPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading config.js:', err);
    return;
  }

  // Remove the problematic import statements
  const patchedData = data.replace(/import\s+.*\s+from\s+'.*power-user\.js';/g, '')
                          .replace(/import\s+.*\s+from\s+'.*script\.js';/g, '')
                          .replace(/import\s+.*\s+from\s+'.*world-info\.js';/g, '')
                          .replace(/import\s+.*\s+from\s+'.*instruct-mode\.js';/g, '')
                          .replace(/import\s+.*\s+from\s+'.*chats\.js';/g, '')
                          .replace(/import\s+.*\s+from\s+'.*openai\.js';/g, '')
                          .replace(/import\s+.*\s+from\s+'.*authors-note\.js';/g, '')
                          .replace(/import\s+.*\s+from\s+'.*group-chats\.js';/g, '')
                          .replace(/import\s+.*\s+from\s+'.*engine\.js';/g, '')
                          .replace(/import\s+.*\s+from\s+'.*utils\.js';/g, '')
                          .replace(/import\s+.*\s+from\s+'.*SlashCommandCommonEnumsProvider\.js';/g, '');

  fs.writeFile(configPath, patchedData, 'utf8', (err) => {
    if (err) {
      console.error('Error writing patched config.js:', err);
    } else {
      console.log('Successfully patched sillytavern-utils-lib/dist/config.js');
    }
  });
});