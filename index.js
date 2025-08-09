import { registerExtension } from 'sillytavern-utils-lib';

registerExtension({
    name: 'htmlfixer',
    displayName: 'HTML Fixer',
    onSettingsChanged: (data, context) => {
        const profileSelect = document.getElementById('promptlink_profile_select');
        const promptInput = document.getElementById('htmlfixer_prompt_input');

        let settings = {
            selectedProfile: '',
            promptText: '',
            ...data,
        };

        const profiles = context.koboldai_settings.presets ? Object.keys(context.koboldai_settings.presets) : [];

        profileSelect.innerHTML = '';
        profiles.forEach(profile => {
            const option = document.createElement('option');
            option.value = profile;
            option.textContent = profile;
            if (profile === settings.selectedProfile) {
                option.selected = true;
            }
            profileSelect.appendChild(option);
        });

        promptInput.value = settings.promptText;

        const saveSettings = () => {
            SillyTavern.extensions.save('htmlfixer', settings);
        };

        profileSelect.addEventListener('change', () => {
            settings.selectedProfile = profileSelect.value;
            saveSettings();
        });

        promptInput.addEventListener('input', () => {
            settings.promptText = promptInput.value;
            saveSettings();
        });
    },
});