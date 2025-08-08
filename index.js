// SillyTavern HtmlFixer Extension
// Fixes broken HTML in messages using an external API

(function () {
    'use strict';

    const extensionName = 'HtmlFixer';
    const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
    
    // Extension settings with defaults
    const defaultSettings = {
        selectedProfile: '',
        autoFix: false,
        apiEndpoint: '',
        apiKey: ''
    };

    let extensionSettings = { ...defaultSettings };

    // Load extension settings using modern API
    function loadSettings() {
        if (typeof getExtensionSettings === 'function') {
            extensionSettings = { ...defaultSettings, ...getExtensionSettings(extensionName) };
        } else {
            // Fallback for older versions
            extensionSettings = { ...defaultSettings, ...(extension_settings[extensionName] || {}) };
        }
    }

    // Save extension settings using modern API
    function saveSettings() {
        if (typeof setExtensionSettings === 'function') {
            setExtensionSettings(extensionName, extensionSettings);
        } else {
            // Fallback for older versions
            extension_settings[extensionName] = extensionSettings;
            if (typeof saveSettingsDebounced === 'function') {
                saveSettingsDebounced();
            }
        }
    }

    // Add HTML fixer button to messages
    function addFixerButton(messageElement) {
        // Check if button already exists
        if (messageElement.querySelector('.html-fixer-btn')) {
            return;
        }

        const button = document.createElement('button');
        button.className = 'html-fixer-btn';
        button.innerHTML = '🔧';
        button.title = 'Fix HTML';
        button.addEventListener('click', () => fixMessageHtml(messageElement));

        // Find the message controls area or create one
        let controlsArea = messageElement.querySelector('.mes_controls');
        if (!controlsArea) {
            controlsArea = document.createElement('div');
            controlsArea.className = 'mes_controls';
            messageElement.appendChild(controlsArea);
        }

        controlsArea.appendChild(button);
    }

    // Fix HTML in a message
    async function fixMessageHtml(messageElement) {
        // Get the message text content
        const messageTextElement = messageElement.querySelector('.mes_text');
        if (!messageTextElement) {
            if (typeof toastr !== 'undefined') {
                toastr.error('Could not find message text element.');
            } else {
                console.error('Could not find message text element.');
            }
            return;
        }

        const originalHtml = messageTextElement.innerHTML;
        
        // Skip if the message doesn't contain HTML tags
        if (!originalHtml.includes('<') || !originalHtml.includes('>')) {
            if (typeof toastr !== 'undefined') {
                toastr.info('No HTML content detected in this message.');
            }
            return;
        }
        
        try {
            // Show loading indicator
            const button = messageElement.querySelector('.html-fixer-btn');
            const originalButtonText = button.innerHTML;
            button.innerHTML = '⏳';
            button.disabled = true;

            // Send request to API
            const fixedHtml = await sendFixRequest(originalHtml);
            
            // Only update if the HTML actually changed
            if (fixedHtml !== originalHtml && fixedHtml.trim() !== '') {
                messageTextElement.innerHTML = fixedHtml;
                
                if (typeof toastr !== 'undefined') {
                    toastr.success('HTML fixed successfully!');
                } else {
                    console.log('HTML fixed successfully!');
                }
            } else {
                if (typeof toastr !== 'undefined') {
                    toastr.info('No HTML fixes were needed.');
                } else {
                    console.log('No HTML fixes were needed.');
                }
            }
            
        } catch (error) {
            console.error('Error fixing HTML:', error);
            if (typeof toastr !== 'undefined') {
                toastr.error('Failed to fix HTML: ' + error.message);
            } else {
                console.error('Failed to fix HTML:', error.message);
            }
        } finally {
            // Restore button
            const button = messageElement.querySelector('.html-fixer-btn');
            if (button) {
                button.innerHTML = '🔧';
                button.disabled = false;
            }
        }
    }

    // Get the current API connection settings
    function getCurrentApiSettings() {
        // Use modern SillyTavern API access methods
        if (typeof getApiUrl === 'function' && typeof getRequestHeaders === 'function') {
            return {
                url: getApiUrl(),
                headers: getRequestHeaders()
            };
        }
        
        // Fallback: try to access current API settings
        if (window.main_api && window.api_server) {
            const apiUrl = window.api_server;
            const headers = {
                'Content-Type': 'application/json'
            };
            
            // Add authorization if available
            if (window.secret_state && window.secret_state.length > 0) {
                headers['Authorization'] = `Bearer ${window.secret_state}`;
            }
            
            return { url: apiUrl, headers };
        }
        
        // Custom endpoint fallback
        if (extensionSettings.apiEndpoint) {
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (extensionSettings.apiKey) {
                headers['Authorization'] = `Bearer ${extensionSettings.apiKey}`;
            }
            
            return {
                url: extensionSettings.apiEndpoint,
                headers
            };
        }
        
        throw new Error('No API connection available. Please configure an API endpoint in settings.');
    }

    // Send fix request to API using modern approach
    async function sendFixRequest(htmlContent) {
        const apiSettings = getCurrentApiSettings();
        
        // Create a prompt for fixing HTML
        const prompt = `Please fix the following broken HTML and return only the corrected HTML without any explanations or markdown formatting:\n\n${htmlContent}`;
        
        // Prepare request body based on API type
        let requestBody;
        
        // Try OpenAI-compatible format first
        if (apiSettings.url.includes('openai') || apiSettings.url.includes('v1/chat/completions')) {
            requestBody = {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an HTML fixing assistant. Fix broken HTML and return only the corrected HTML without explanations.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 2000,
                temperature: 0.1
            };
        } else {
            // Generic completion format
            requestBody = {
                prompt: prompt,
                max_tokens: 2000,
                temperature: 0.1,
                stop: ['</html>', '\n\n---']
            };
        }

        const response = await fetch(apiSettings.url, {
            method: 'POST',
            headers: apiSettings.headers,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Extract the fixed HTML from various response formats
        let fixedHtml = htmlContent; // fallback to original
        
        if (data.choices && data.choices[0]) {
            // OpenAI format
            fixedHtml = data.choices[0].message?.content || data.choices[0].text || fixedHtml;
        } else if (data.response) {
            // Generic response format
            fixedHtml = data.response;
        } else if (data.text) {
            // Text completion format
            fixedHtml = data.text;
        } else if (data.content) {
            // Alternative content format
            fixedHtml = data.content;
        }
        
        // Clean up the response (remove any markdown formatting)
        fixedHtml = fixedHtml.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
        
        return fixedHtml;
    }

    // Add buttons to existing messages
    function addButtonsToExistingMessages() {
        const messages = document.querySelectorAll('.mes');
        messages.forEach(addFixerButton);
    }

    // Observer to add buttons to new messages
    function setupMessageObserver() {
        const chatContainer = document.getElementById('chat');
        if (!chatContainer) {
            // Retry after a delay if chat container not found
            setTimeout(setupMessageObserver, 1000);
            return;
        }

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('mes')) {
                        addFixerButton(node);
                        
                        // Auto-fix if enabled
                        if (extensionSettings.autoFix) {
                            setTimeout(() => autoFixMessage(node), 500);
                        }
                    }
                });
            });
        });

        observer.observe(chatContainer, { childList: true, subtree: true });
    }

    // Auto-fix message if it contains broken HTML
    async function autoFixMessage(messageElement) {
        const messageTextElement = messageElement.querySelector('.mes_text');
        if (!messageTextElement) return;

        const html = messageTextElement.innerHTML;
        
        // Simple check for potentially broken HTML
        const openTags = (html.match(/</g) || []).length;
        const closeTags = (html.match(/>/g) || []).length;
        const hasUnclosedTags = html.match(/<[^>]*$/);
        
        if (openTags !== closeTags || hasUnclosedTags) {
            console.log('Auto-fixing potentially broken HTML in message');
            await fixMessageHtml(messageElement);
        }
    }

    // Utility function to check if HTML is valid
    function isValidHtml(html) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            return !doc.querySelector('parsererror');
        } catch (e) {
            return false;
        }
    }

    // Create settings UI
    function createSettingsUI() {
        const settingsHtml = `
            <div class="html-fixer-settings">
                <h3>HTML Fixer Settings</h3>
                <div class="form-group">
                    <label for="html-fixer-auto">Auto-fix HTML on message send:</label>
                    <input type="checkbox" id="html-fixer-auto" ${extensionSettings.autoFix ? 'checked' : ''}>
                </div>
                <div class="form-group">
                    <label for="html-fixer-endpoint">Custom API Endpoint (optional):</label>
                    <input type="text" id="html-fixer-endpoint" class="form-control"
                           value="${extensionSettings.apiEndpoint}"
                           placeholder="https://api.openai.com/v1/chat/completions">
                    <small>Leave empty to use current SillyTavern API connection</small>
                </div>
                <div class="form-group">
                    <label for="html-fixer-key">API Key (if using custom endpoint):</label>
                    <input type="password" id="html-fixer-key" class="form-control"
                           value="${extensionSettings.apiKey}"
                           placeholder="Your API key">
                </div>
                <div class="form-group">
                    <button id="html-fixer-test" class="btn btn-primary">Test Connection</button>
                </div>
            </div>
        `;

        return settingsHtml;
    }

    // Setup settings event listeners
    function setupSettingsListeners() {
        const autoCheckbox = document.getElementById('html-fixer-auto');
        const endpointInput = document.getElementById('html-fixer-endpoint');
        const keyInput = document.getElementById('html-fixer-key');
        const testButton = document.getElementById('html-fixer-test');

        if (autoCheckbox) {
            autoCheckbox.addEventListener('change', (e) => {
                extensionSettings.autoFix = e.target.checked;
                saveSettings();
            });
        }

        if (endpointInput) {
            endpointInput.addEventListener('input', (e) => {
                extensionSettings.apiEndpoint = e.target.value;
                saveSettings();
            });
        }

        if (keyInput) {
            keyInput.addEventListener('input', (e) => {
                extensionSettings.apiKey = e.target.value;
                saveSettings();
            });
        }

        if (testButton) {
            testButton.addEventListener('click', async () => {
                testButton.disabled = true;
                testButton.textContent = 'Testing...';
                
                try {
                    await sendFixRequest('<p>Test HTML</p>');
                    if (typeof toastr !== 'undefined') {
                        toastr.success('API connection test successful!');
                    } else {
                        alert('API connection test successful!');
                    }
                } catch (error) {
                    if (typeof toastr !== 'undefined') {
                        toastr.error('API connection test failed: ' + error.message);
                    } else {
                        alert('API connection test failed: ' + error.message);
                    }
                } finally {
                    testButton.disabled = false;
                    testButton.textContent = 'Test Connection';
                }
            });
        }
    }

    // Initialize extension
    function init() {
        console.log('HtmlFixer extension initializing...');
        loadSettings();
        
        // Add buttons to existing messages
        addButtonsToExistingMessages();
        
        // Setup observer for new messages
        setupMessageObserver();
        
        // Register settings using modern API
        if (typeof registerExtensionSettings === 'function') {
            registerExtensionSettings(extensionName, createSettingsUI(), setupSettingsListeners);
        } else if (typeof SlashCommandParser !== 'undefined') {
            // Alternative registration method for newer versions
            SlashCommandParser.addCommandObject({
                name: 'htmlfixer',
                callback: () => {
                    const settingsModal = document.createElement('div');
                    settingsModal.innerHTML = createSettingsUI();
                    document.body.appendChild(settingsModal);
                    setupSettingsListeners();
                },
                helpString: 'Open HTML Fixer settings'
            });
        }
        
        console.log('HtmlFixer extension initialized successfully');
    }

    // Modern SillyTavern event handling
    function waitForSillyTavern() {
        // Try modern event system first
        if (typeof eventSource !== 'undefined' && eventSource.on) {
            eventSource.on('app_ready', init);
            return;
        }
        
        // Try jQuery-based events
        if (typeof $ !== 'undefined') {
            $(document).ready(() => {
                // Wait a bit more for SillyTavern to fully load
                setTimeout(init, 1000);
            });
            return;
        }
        
        // Fallback to DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(init, 1000);
            });
        } else {
            setTimeout(init, 1000);
        }
    }

    // Start the extension
    waitForSillyTavern();

})();