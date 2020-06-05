/**
  Name: Jay Lin
  Last Updated: 06.03.2020
  Script for handling speech to text recognition using Microsoft Cognitive Services.
**/

var SpeechSDK;
var recognizer;
const startB = document.getElementById("startSpeechToText");
const endB = document.getElementById("endSpeechToText");
const phraseDiv = document.getElementById("msg_log");
var speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
        "d3d083cb751b4fb2ba568ba373d4c43f",
        "westus2"
);
speechConfig.speechRecognitionLanguage = "en-US";

/** Toggles appearance and functionality of Speech-To-Text buttons.
 * @param {boolean} bool - Is true if the start speech-to-text button 
 *      should be disabled, and vice versa for the end button.
 */
function toggleSpeechToTextButtons(bool) {
    startB.disabled = bool;
    endB.disabled = !bool;
    if (bool) {
        startB.style.display = "none";
        endB.style.display = "block";
    }
    else {
        startB.style.display = "block";
        endB.style.display = "none";
    }
}

// Enables Speech-To-Text functionality for chat messages while user is inside a Room.
function enableSpeechText() {
    toggleSpeechToTextButtons(true);
    let audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

    recognizer.recognizeOnceAsync(
        function (result) {
            if (result.text != "undefined") {
                window.console.log(result);
                document.getElementById("usermsg").value = result.text;
                sendMessage();
                disableSpeechText();
            }
        },
        function (err) {
            startRecognizeOnceAsyncButton.disabled = false;
            phraseDiv.innerHTML += "Error: " + err + ". Could not recognize speech.";
            window.console.log(err);
            disableSpeechText();
    });
}

// Disables Speech-To-Text functionality.
function disableSpeechText() {
    toggleSpeechToTextButtons(false);
    recognizer.close();
    recognizer = undefined;
    console.log("\n Stopped Recog.");
}