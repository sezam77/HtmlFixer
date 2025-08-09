import { ExtensionSettingsManager } from 'sillytavern-utils-lib';

const extensionName = 'HtmlFixer';
const globalContext = SillyTavern.getContext();

const DEFAULT_SETTINGS = {
    selectedProfile: "",
    promptText: ""
};

const settingsManager = new ExtensionSettingsManager('HtmlFixer', DEFAULT_SETTINGS);

async function handleUIChanges() {
    const settingsHtml = await globalContext.renderExtensionTemplateAsync(`third-party/${extensionName}`, 'display');
    $('#extensions_settings').append(settingsHtml);

    const settingsContainer = $('.htmlfixer_settings');
    const profileSelect = settingsContainer.find("#promptlink_profile_select");
    const promptInput = settingsContainer.find("#htmlfixer_prompt_input");

    const settings = settingsManager.getSettings();

    const profiles = globalContext.koboldai_settings.presets ? Object.keys(globalContext.koboldai_settings.presets) : [];

    profileSelect.innerHTML = "";
    profiles.forEach(profile => {
        const option = document.createElement("option");
        option.value = profile;
        option.textContent = profile;
        if (profile === settings.selectedProfile) {
            option.selected = true;
        }
        profileSelect.append(option);
    });

    promptInput.val(settings.promptText);

    profileSelect.on("change", () => {
        settings.selectedProfile = profileSelect.val();
        settingsManager.saveSettings();
    });

    promptInput.on("input", () => {
        settings.promptText = promptInput.val();
        settingsManager.saveSettings();
    });
}

function main() {
    settingsManager.loadSettings().then(() => {
        handleUIChanges();
    }).catch(error => {
        console.error("Failed to load HtmlFixer settings:", error);
    });
}

main();