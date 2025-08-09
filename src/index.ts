import { ExtensionSettingsManager, ConnectionProfile } from 'sillytavern-utils-lib';

const extensionName = 'HtmlFixer';
const globalContext = SillyTavern.getContext();

const KEYS = {
  EXTENSION: 'htmlfixer',
} as const;

interface ExtensionSettings {
  profileId: string;
  prompt: string;
}

const DEFAULT_SETTINGS: ExtensionSettings = {
  profileId: '',
  prompt: '',
};

const settingsManager = new ExtensionSettingsManager<ExtensionSettings>(KEYS.EXTENSION, DEFAULT_SETTINGS);

async function handleUIChanges(): Promise<void> {
  const settingsHtml: string = await globalContext.renderExtensionTemplateAsync(
    `third-party/${extensionName}`,
    'templates/settings',
  );
  $('#extensions_settings').append(settingsHtml);

  const settingsContainer = $('.htmlfixer_settings');
  const settings = settingsManager.getSettings();

  // Connection Profile Dropdown
  globalContext.ConnectionManagerRequestService.handleDropdown(
    '.htmlfixer_settings .connection_profile',
    settings.profileId,
    (profile: ConnectionProfile | null) => {
      settings.profileId = profile?.id ?? '';
      settingsManager.saveSettings();
    },
  );

  // Prompt Textarea
  const promptElement = settingsContainer.find('textarea.prompt');
  promptElement.val(settings.prompt);
  promptElement.on('change', function () {
    const promptValue = promptElement.val() as string;
    settings.prompt = promptValue;
    settingsManager.saveSettings();
  });
}

function main() {
  settingsManager.initializeSettings().then(() => {
    handleUIChanges();
  });
}

main();