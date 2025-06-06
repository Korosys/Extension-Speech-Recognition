// Borrowed from Agnai (AGPLv3)
// https://github.com/agnaistic/agnai/blob/dev/web/pages/Chat/components/SpeechRecognitionRecorder.tsx
// First version by Cohee#1207
// Adapted by Tony-sama

import { activateMicIcon, deactivateMicIcon } from './index.js';
export { BrowserSttProvider };

const DEBUG_PREFIX = '<Speech Recognition module (Browser)> ';

class BrowserSttProvider {
    //########//
    // Config //
    //########//

    settings = {
        language: '',
    };

    defaultSettings = {
        language: 'en-US',
    };

    processTranscriptFunction = null;

    get settingsHtml() {
        let html = ' \
        <span>Language</span> </br> \
        <select id="speech_recognition_browser_provider_language"> \
            <option value="ar-SA">ar-SA: Arabic (Saudi Arabia)</option> \
            <option value="bn-BD">bn-BD: Bangla (Bangladesh)</option> \
            <option value="bn-IN">bn-IN: Bangla (India)</option> \
            <option value="cs-CZ">cs-CZ: Czech (Czech Republic)</option> \
            <option value="da-DK">da-DK: Danish (Denmark)</option> \
            <option value="de-AT">de-AT: German (Austria)</option> \
            <option value="de-CH">de-CH: German (Switzerland)</option> \
            <option value="de-DE">de-DE: German (Germany)</option> \
            <option value="el-GR">el-GR: Greek (Greece)</option> \
            <option value="en-AU">en-AU: English (Australia)</option> \
            <option value="en-CA">en-CA: English (Canada)</option> \
            <option value="en-GB">en-GB: English (United Kingdom)</option> \
            <option value="en-IE">en-IE: English (Ireland)</option> \
            <option value="en-IN">en-IN: English (India)</option> \
            <option value="en-NZ">en-NZ: English (New Zealand)</option> \
            <option value="en-US">en-US: English (United States)</option> \
            <option value="en-ZA">en-ZA: English (South Africa)</option> \
            <option value="es-AR">es-AR: Spanish (Argentina)</option> \
            <option value="es-CL">es-CL: Spanish (Chile)</option> \
            <option value="es-CO">es-CO: Spanish (Columbia)</option> \
            <option value="es-ES">es-ES: Spanish (Spain)</option> \
            <option value="es-MX">es-MX: Spanish (Mexico)</option> \
            <option value="es-US">es-US: Spanish (United States)</option> \
            <option value="fi-FI">fi-FI: Finnish (Finland)</option> \
            <option value="fr-BE">fr-BE: French (Belgium)</option> \
            <option value="fr-CA">fr-CA: French (Canada)</option> \
            <option value="fr-CH">fr-CH: French (Switzerland)</option> \
            <option value="fr-FR">fr-FR: French (France)</option> \
            <option value="he-IL">he-IL: Hebrew (Israel)</option> \
            <option value="hi-IN">hi-IN: Hindi (India)</option> \
            <option value="hu-HU">hu-HU: Hungarian (Hungary)</option> \
            <option value="id-ID">id-ID: Indonesian (Indonesia)</option> \
            <option value="it-CH">it-CH: Italian (Switzerland)</option> \
            <option value="it-IT">it-IT: Italian (Italy)</option> \
            <option value="ja-JP">ja-JP: Japanese (Japan)</option> \
            <option value="ko-KR">ko-KR: Korean (Republic of Korea)</option> \
            <option value="nl-BE">nl-BE: Dutch (Belgium)</option> \
            <option value="nl-NL">nl-NL: Dutch (The Netherlands)</option> \
            <option value="no-NO">no-NO: Norwegian (Norway)</option> \
            <option value="pl-PL">pl-PL: Polish (Poland)</option> \
            <option value="pt-BR">pt-BR: Portugese (Brazil)</option> \
            <option value="pt-PT">pt-PT: Portugese (Portugal)</option> \
            <option value="ro-RO">ro-RO: Romanian (Romania)</option> \
            <option value="ru-RU">ru-RU: Russian (Russian Federation)</option> \
            <option value="sk-SK">sk-SK: Slovak (Slovakia)</option> \
            <option value="sv-SE">sv-SE: Swedish (Sweden)</option> \
            <option value="ta-IN">ta-IN: Tamil (India)</option> \
            <option value="ta-LK">ta-LK: Tamil (Sri Lanka)</option> \
            <option value="th-TH">th-TH: Thai (Thailand)</option> \
            <option value="tr-TR">tr-TR: Turkish (Turkey)</option> \
            <option value="zh-CN">zh-CN: Chinese (China)</option> \
            <option value="zh-HK">zh-HK: Chinese (Hond Kong)</option> \
            <option value="zh-TW">zh-TW: Chinese (Taiwan)</option> \
        </select> \
        ';
        return html;
    }

    onSettingsChange() {
        // Used when provider settings are updated from UI
        this.settings.language = $('#speech_recognition_browser_provider_language').val();
        console.debug(DEBUG_PREFIX + 'Change language to', this.settings.language);
        this.loadSettings(this.settings);
    }

    static capitalizeInterim(interimTranscript) {
        let capitalizeIndex = -1;
        if (interimTranscript.length > 2 && interimTranscript[0] === ' ') capitalizeIndex = 1;
        else if (interimTranscript.length > 1) capitalizeIndex = 0;
        if (capitalizeIndex > -1) {
            const spacing = capitalizeIndex > 0 ? ' '.repeat(capitalizeIndex - 1) : '';
            const capitalized = interimTranscript[capitalizeIndex].toLocaleUpperCase();
            const rest = interimTranscript.substring(capitalizeIndex + 1);
            interimTranscript = spacing + capitalized + rest;
        }
        return interimTranscript;
    }

    static composeValues(previous, interim) {
        let spacing = '';
        if (previous.endsWith('.')) spacing = ' ';
        return previous + spacing + interim;
    }

    loadSettings(settings) {
        const processTranscript = this.processTranscriptFunction;

        // Populate Provider UI given input settings
        if (Object.keys(settings).length == 0) {
            console.debug(DEBUG_PREFIX + 'Using default browser STT settings');
        }

        // Initialise as defaultSettings
        this.settings = this.defaultSettings;

        for (const key in settings) {
            if (key in this.settings) {
                this.settings[key] = settings[key];
            } else {
                throw `Invalid setting passed to Speech recogniton extension (browser): ${key}`;
            }
        }

        $('#speech_recognition_browser_provider_language').val(this.settings.language);

        const speechRecognitionSettings = {
            grammar: '' // Custom grammar
        };

        const speechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const speechRecognitionList = window.SpeechGrammarList || window.webkitSpeechGrammarList;

        if (!speechRecognition) {
            console.warn(DEBUG_PREFIX + 'Speech recognition is not supported in this browser.');
            $('#microphone_button').hide();
            toastr.error('Speech recognition is not supported in this browser, use another browser or another provider of SillyTavern-extras Speech recognition extension.', 'Speech recognition activation Failed (Browser)', { timeOut: 10000, extendedTimeOut: 20000, preventDuplicates: true });
            return;
        }

        const recognition = new speechRecognition();

        if (speechRecognitionSettings.grammar && speechRecognitionList) {
            let recognitionList = speechRecognitionList;
            if (typeof speechRecognitionList === 'function') {
                recognitionList = new speechRecognitionList();
            }
            recognitionList.addFromString(speechRecognitionSettings.grammar, 1);
            recognition.grammars = recognitionList;
        }

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = this.settings.language;

        const textarea = $('#send_textarea');
        const button = $('#microphone_button');

        let listening = false;
        let heartbeatInterval = null;
        
        // Function to check if voice activation is enabled
        const isVoiceActivationEnabled = () => {
            return $('#speech_recognition_voice_activation_enabled').is(':checked');
        };
        
        // Function to start recognition if not already listening
        const startRecognition = () => {
            try {
                if (!listening) {
                    recognition.start();
                    listening = true;
                    activateMicIcon(button);
                    console.debug(DEBUG_PREFIX + 'Recognition started');
                }
            } catch (error) {
                console.error(DEBUG_PREFIX + 'Error starting recognition:', error);
                listening = false;
                // Try again after a short delay
                setTimeout(() => {
                    if (isVoiceActivationEnabled()) {
                        startRecognition();
                    }
                }, 1000);
            }
        };

        // Setup a heartbeat to ensure recognition keeps running
        const setupHeartbeat = () => {
            // Clear any existing heartbeat
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
            }
            
            // Set up a new heartbeat that checks every 5 seconds
            heartbeatInterval = setInterval(() => {
                if (isVoiceActivationEnabled()) {
                    if (!listening) {
                        console.debug(DEBUG_PREFIX + 'Heartbeat detected recognition stopped, restarting...');
                        startRecognition();
                    } else {
                        console.debug(DEBUG_PREFIX + 'Heartbeat: recognition is active');
                    }
                } else {
                    // Voice activation was disabled, clear the heartbeat
                    clearInterval(heartbeatInterval);
                    heartbeatInterval = null;
                }
            }, 5000);
        };
        
        // Initialize voice activation if enabled
        const initVoiceActivation = () => {
            if (isVoiceActivationEnabled()) {
                console.debug(DEBUG_PREFIX + 'Voice activation enabled, starting recognition automatically');
                startRecognition();
                setupHeartbeat();
            }
        };
        
        // Start recognition automatically when voice activation is enabled
        initVoiceActivation();
        
        // Monitor the voice activation checkbox for changes
        $('#speech_recognition_voice_activation_enabled').off('change').on('change', function() {
            if (this.checked) {
                console.debug(DEBUG_PREFIX + 'Voice activation turned on, starting recognition');
                startRecognition();
                setupHeartbeat();
            } else if (listening) {
                console.debug(DEBUG_PREFIX + 'Voice activation turned off, stopping recognition');
                recognition.stop();
                listening = false;
                deactivateMicIcon(button);
                
                // Clear the heartbeat
                if (heartbeatInterval) {
                    clearInterval(heartbeatInterval);
                    heartbeatInterval = null;
                }
            }
        });

        // Make sure to clean up the heartbeat when the provider is stopped
        this.stopHeartbeat = () => {
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
                heartbeatInterval = null;
                console.debug(DEBUG_PREFIX + 'Heartbeat stopped');
            }
        };

        button.off('click').on('click', function () {
            if (listening) {
                recognition.stop();
                listening = false;
                deactivateMicIcon(button);
            } else {
                recognition.start();
                listening = true;
                activateMicIcon(button);
            }
        });

        let initialText = '';
        let finalTranscript = '';

        recognition.onresult = function (speechEvent) {
            let interimTranscript = '';

            for (let i = speechEvent.resultIndex; i < speechEvent.results.length; ++i) {
                const transcript = speechEvent.results[i][0].transcript;

                if (speechEvent.results[i].isFinal) {
                    let interim = BrowserSttProvider.capitalizeInterim(transcript);
                    if (interim != '') {
                        let final = finalTranscript;
                        final = BrowserSttProvider.composeValues(final, interim);
                        if (final.slice(-1) != '.' && final.slice(-1) != '?') final += '.';
                        finalTranscript = final;
                    }
                    interimTranscript = ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            interimTranscript = BrowserSttProvider.capitalizeInterim(interimTranscript);
            textarea.val(initialText + finalTranscript + interimTranscript);
            
            // Only stop listening if we're not in voice activation mode
            if (finalTranscript && !interimTranscript.trim() && !isVoiceActivationEnabled()) {
                recognition.stop();
            } else if (finalTranscript && !interimTranscript.trim() && isVoiceActivationEnabled()) {
                // In voice activation mode, process the transcript without stopping recognition
                console.debug(DEBUG_PREFIX + 'Processing transcript while keeping recognition active');
                const transcriptToProcess = finalTranscript;
                
                // Reset the textarea
                textarea.val(textarea.val().substring(0, initialText.length));
                
                // Process the transcript
                processTranscript(transcriptToProcess);
                
                // Reset for the next speech input
                finalTranscript = '';
            }
        };

        recognition.onerror = function (event) {
            console.error(DEBUG_PREFIX + 'Error occurred in recognition:', event.error);
            
            // Handle no-speech errors specially - these are normal during silence
            if (event.error === 'no-speech') {
                console.debug(DEBUG_PREFIX + 'No speech detected, this is normal during silence');
                // Don't mark as not listening, let the onend handler restart if needed
            } else {
                // For other errors, mark as not listening so the heartbeat or onend can restart
                listening = false;
                console.debug(DEBUG_PREFIX + 'Recognition marked as stopped due to error');
            }
            
            // If voice activation is enabled, let the onend handler restart it
            // The heartbeat will also restart if onend fails
        };

        recognition.onend = function () {
            console.debug(DEBUG_PREFIX + 'Recognition ended');
            
            // If voice activation is enabled, restart recognition automatically
            if (isVoiceActivationEnabled()) {
                console.debug(DEBUG_PREFIX + 'Voice activation enabled, restarting recognition');
                // Try to restart immediately
                try {
                    recognition.start();
                    listening = true;
                    console.debug(DEBUG_PREFIX + 'Recognition restarted successfully');
                } catch (error) {
                    // If immediate restart fails, mark as not listening and let the heartbeat handle it
                    console.error(DEBUG_PREFIX + 'Failed to restart recognition:', error);
                    listening = false;
                    deactivateMicIcon(button);
                }
            } else {
                listening = false;
                deactivateMicIcon(button);
                
                // Process the full final transcript
                if (finalTranscript) {
                    textarea.val(textarea.val().substring(0, initialText.length));
                    processTranscript(finalTranscript);
                    finalTranscript = ''; // Reset for next use
                }
            }
        };

        recognition.onstart = function () {
            initialText = textarea.val();
            finalTranscript = ''; // Reset transcript on new recording
            console.debug(DEBUG_PREFIX + 'recorder started');
            activateMicIcon(button);

            if ($('#speech_recognition_message_mode').val() == 'replace') {
                textarea.val('');
                initialText = '';
            }
        };

        $('#microphone_button').show();

        console.debug(DEBUG_PREFIX + 'Browser STT settings loaded');
    }

    // Add a cleanup method to the provider
    cleanup() {
        if (this.stopHeartbeat) {
            this.stopHeartbeat();
        }
    }

}
