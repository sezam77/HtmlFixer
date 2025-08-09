import { getContext } from "../../../extensions.js";

// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
    // Get references to the UI elements
    const profileSelect = document.getElementById("promptlink_profile_select");
    const promptInput = document.getElementById("htmlfixer_prompt_input");

    // Default settings
    let settings = {
        selectedProfile: "",
        promptText: ""
    };

    // Function to save settings
    function saveSettings() {
        SillyTavern.extensions.save("HtmlFixer", settings);
    }

    // Function to load settings and populate UI
    function onSettingsChanged(data) {
        settings = { ...settings, ...data };
        const context = getContext();
        // Get connection profiles from SillyTavern
        const profiles = context.koboldai_settings.presets ? Object.keys(context.koboldai_settings.presets) : [];

        // Populate the profile select dropdown
        profileSelect.innerHTML = "";
        profiles.forEach(profile => {
            const option = document.createElement("option");
            option.value = profile;
            option.textContent = profile;
            if (profile === settings.selectedProfile) {
                option.selected = true;
            }
            profileSelect.appendChild(option);
        });

        // Set the prompt text
        promptInput.value = settings.promptText;
    }

    // Add event listeners to save settings on change
    profileSelect.addEventListener("change", () => {
        settings.selectedProfile = profileSelect.value;
        saveSettings();
    });

    promptInput.addEventListener("input", () => {
        settings.promptText = promptInput.value;
        saveSettings();
    });

    // Expose the onSettingsChanged function to SillyTavern
    SillyTavern.extensions.register("HtmlFixer", {
        onSettingsChanged: onSettingsChanged
    });
});