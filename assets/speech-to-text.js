/**
  Name: Jay Lin
  Last Updated: 05.02.2020
  This is the script for handling speech to text recognition.
  Code taken from official tutorial on Microsoft Build's website: 
  https://docs.microsoft.com/en-us/javascript/api/overview/azure/speech-service?view=azure-node-latest
**/

// import {
//     AudioConfig,
//     CancellationDetails,
//     CancellationReason,
//     PhraseListGrammar,
//     ResultReason,
//     SpeechConfig,
//     SpeechRecognizer
// } from "microsoft-cognitiveservices-speech-sdk";

// status fields and start button in UI
// subscription key and region for speech services.
var SpeechSDK;

document.addEventListener("DOMContentLoaded", function () {
  let startB = document.getElementById("startSpeechToText");
  let phraseDiv = document.getElementById("msg_log");
  const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
  'd3d083cb751b4fb2ba568ba373d4c43f',
  'westus2'
  );
  speechConfig.speechRecognitionLanguage = "en-US"; // TODO: add CHINESE recog functionality
  var audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
  let recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

  // listens for a click on a certain button
  startB.addEventListener("click", function () {
      if (startB.innerHTML == "Enable Speech-To-Text") { // if the start button has not been pressed yet
          startB.innerHTML == "Disable Speech-To-Text"
          recognizer.recognizing = (s, e) => {
              console.log(`RECOGNIZING: Text=${e.result.text}`);
          };
          recognizer.recognized = (s, e) => {
              console.log("username is" + username);
              if (e.result.reason == ResultReason.RecognizedSpeech) {
                  console.log(`RECOGNIZED: Text=${e.result.text}`);
                  phraseDiv.innerHTML += "<h6>" + username + ": " + e.result.text + "</h6>";
              }
              else if (e.result.reason == ResultReason.NoMatch) {
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
          recognizer.startContinuousRecognitionAsync();
      }
      else {
          console.log("\n Session stopped through user click.");
          recognizer.stopContinuousRecognitionAsync();
          startB.innerHTML = "Enable Speech-To-Text";
      }
  });
});
