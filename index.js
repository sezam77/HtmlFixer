import {
    generateRaw,
    getContext,
} from '../../../../script.js';

const fixHtmlButtonClass = 'fix-html-button';

async function fixHtml(messageId) {
    const context = getContext();
    const message = context.chat[messageId];
    const originalHtml = message.mes;

    const prompt = `Ignore everything except the following HTML/CSS. Your task is to fix any syntax errors or malformed structures in the code. Return the exact same text but with the necessary corrections applied. Do not use JavaScript or add any explanations or commentary outside of the corrected code itself. Here is the code: ${originalHtml}`;

    try {
        const correctedHtml = await generateRaw({ prompt });
        message.mes = correctedHtml;
        const messageElement = document.querySelector(`[mesid="${messageId}"] .mes_text`);
        if (messageElement) {
            messageElement.innerHTML = correctedHtml;
        }
        context.saveChatDebounced();
    } catch (error) {
        console.error('HTML Fixer Error:', error);
    }
}

function addFixHtmlButton() {
    const html = `<div title="Fix HTML/CSS" class="mes_button ${fixHtmlButtonClass} fa-solid fa-code" tabindex="0"></div>`;
    $('#message_template .mes_buttons .extraMesButtons').prepend(html);

    $('#chat').on('click', `.${fixHtmlButtonClass}`, function () {
        const message_block = $(this).closest('.mes');
        const message_id = Number(message_block.attr('mesid'));
        fixHtml(message_id);
    });
}

jQuery(async () => {
    addFixHtmlButton();
});