/**
  Name: Jay Lin
  Last Updated: 05.02.2020
  This is the script for handling speech to text recognition.
  Code taken from official tutorial on Microsoft Build's website: 
  https://docs.microsoft.com/en-us/javascript/api/overview/azure/speech-service?view=azure-node-latest
**/
var SpeechSDK;
var recognizer;
var isClicked = false;
var startB = document.getElementById("startSpeechToText");
var phraseDiv = document.getElementById("msg_log");
var speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
        "d3d083cb751b4fb2ba568ba373d4c43f",
        "westus2"
);
speechConfig.speechRecognitionLanguage = "en-US";

function enableSpeechText() {
    isClicked
        ? (document.getElementById("startSpeechToText").innerHTML =
            "Enable Speech-To-Text")
        : (document.getElementById("startSpeechToText").innerHTML =
            "Disable Speech-To-Text");

    isClicked = !isClicked;
    // if we got an authorization token, use the token. Otherwise use the provided subscription key

    let audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
    recognizer.recognizing = (s, e) => {
        console.log(`RECOGNIZING: Text=${e.result.text}`);
    };
    recognizer.recognized = (s, e) => {
    if (e.result.reason == ResultReason.RecognizedSpeech) {
        console.log(`RECOGNIZED: Text=${e.result.text}`);
        phraseDiv.innerHTML += "<h6>" + username + ": " + e.result.text + "</h6>";
    } else if (e.result.reason == ResultReason.NoMatch) {
        console.log("NOMATCH: Speech could not be recognized.");
    }
    };
    recognizer.canceled = (s, e) => {
        console.log(`CANCELED: Reason=${e.reason}`);
        recognizer.stopContinuousRecognitionAsync();
    };
    recognizer.sessionStopped = (s, e) => {
        console.log("\n Session stopped event.");
        startB.disabled = true;
        recognizer.stopContinuousRecognitionAsync();
    };
    if (isClicked) {
        console.log("\n Started Recog.");
        recognizer.startContinuousRecognitionAsync();
    } else {
        console.log("\n Stopped Recog.");
        recognizer.stopContinuousRecognitionAsync();
    }
    startB.disabled = true;
}
