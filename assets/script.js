/** Adding views to HTML */
function addView(id, show) {
  console.log("your id is " + id);
  if (!$("#" + id)[0]) {
    // the video itself
    $("<div/>", {
      id: "remote_video_panel_" + id,
      class: "video-view",
    }).appendTo("#video");

    // the container upper bar for the name
    $("<div/>", {
      id: "nickname_container_" + id,
      class: "agora-primary-bg",
    }).appendTo("#remote_video_panel_" + id);

    // nickname
    $("#nickname_container_" + id).append("<h5>" + username + "</h5>");// wrong

    $("<div/>", {
      id: "remote_video_" + id,
      class: "video-placeholder",
    }).appendTo("#remote_video_panel_" + id);

    $("<div/>", {
      id: "remote_video_info_" + id,
      class: "video-profile",
    }).appendTo("#remote_video_panel_" + id);

    $("<div/>", {
      id: "video_autoplay_" + id,
      class: "autoplay-fallback hide",
    }).appendTo("#remote_video_panel_" + id);
  }
}
function removeView(id) {
  if ($("#remote_video_panel_" + id)[0]) {
    $("#remote_video_panel_" + id).remove();
  }
}
function addMessageToView(msg, sender) {
  console.log("Message being sent = " + msg);
  document.getElementById('msg_log').innerHTML += "<h6>" + sender 
        + ": " + msg + "</h6>";
}

/** jQuery stuff */
$(document).ready(function () {
  console.log("ready!");
});
$("#leave").click(leaveChannel);

/** global variables and fields */
var channel_name = "";
var username = ""; // user's displayed name
var user_msg_id = Math.floor(Math.random() * 1000000); // for messaging only
var isSharingScreen = false;
var rtc = {
  client: null, //The handle for the Agora client
  joined: false,
  published: false,
  localStream: null, //Our local video stream
  remoteStreams: [], //An array of remote video streams
  params: {}, //Any params we may want to pass to Agora
};
var RTMchannel; // placeholder for real-time messaging channel
var option = { // Options for joining a channel
  appID: "e435e4e68cb94a26900f3fbffee5ef09", // tells agora who you are as a user
  channel: "Mystery Room", // chat rooms
  uid: 0, // tells agora "we don't have our own user id, make one for us"
  token: null, // to identify user, security purposes, changed to null for now
};
const RTMclient = AgoraRTM.createInstance("6669f3e9d71b42ed8fabfbc3a2146ba1"); // YourAppId

/** Real Time Video Client */
rtc.client = AgoraRTC.createClient({
  mode: "rtc",
  codec: "h264", // common video codec optimized for web
});
rtc.client.init(
  option.appID,
  function () {
    console.log("RTC client initialized");
  },
  // catches any error
  function (err) {
    console.error("init failed");
  }
);

/* Real-Time Messaging Client */
RTMclient.on("ConnectionStateChange", (newState, reason) => {
  console.log(
    "on connection state changed to " + newState + " reason: " + reason
  );
});
// login as a client of Real time Messaging
RTMclient.login({ token: null, uid: "" + user_msg_id})
.then(() => {
  console.log("AgoraRTM client login success: userID = " + user_msg_id);
})
.catch((err) => {
  console.log("AgoraRTM client login failure", err);
});

/* Listeners */
rtc.client.on("stream-added", function (evt) { // stream added, get the Id, subscribe
  let remoteStream = evt.stream;
  let id = remoteStream.getId();
  if (id !== rtc.params.uid) {
    rtc.client.subscribe(remoteStream, function (err) {
      console.error("Failed to subscribe to remote stream ", err);
    });
  }
  console.log("stream-added remote-uid: ", id);
});
rtc.client.on("stream-subscribed", function (evt) {
  // does this get invoked when another person enters?
  let remoteStream = evt.stream;
  let id = remoteStream.getId();
  addView(id);
  remoteStream.play("remote_video_" + id);
  rtc.remoteStreams.push(remoteStream);
  console.log("stream-subscribed remote-uid ", id);
});
// when the stream is added, get the Id and subscribe
rtc.client.on("stream-removed", function (evt) {
  let remoteStream = evt.stream;
  let id = remoteStream.getId();
  if (remoteStream.isPlaying()) {
    remoteStream.stop();
  }
  // keep all items without id
  rtc.remoteStreams = rtc.remoteStreams.filter((item) => item.getId !== id);
  console.log("stream-removed remote-uid ", id);
});
// when someone else leaves the call
rtc.client.on("peer-leave", function (evt) {
  let id = evt.uid;
  removeView(id);
  rtc.remoteStreams = rtc.remoteStreams.filter((item) => item.getId !== id);
  console.log("peer-leave remote-uid ", id);
});

/** functions */
function joinChannel(cname, videoOn) {
  console.log("Joined rtc channel: " + cname);
  channel_name = cname;

  // re-enable all buttons
  document.getElementById("share").disabled = false;
  document.getElementById("submitmsg").disabled = false;
  document.getElementById("usermsg").disabled = false;

  // display channel name, checking if first person or not
  document.getElementById("channel_name").innerHTML =
    "Current Room Name: " + cname;
  username = prompt("Please enter your name:", "");
  // this is currently not working for > 1 person
  document.getElementById("nickname_").innerHTML = username; 

  rtc.client.join(option.token, channel_name, option.uid, function (uid) {
    rtc.params.uid = uid;
    rtc.localStream = AgoraRTC.createStream({ // enable user permissions
      streamID: rtc.params.uid,
      audio: !videoOn,
      video: !videoOn,
      screen: videoOn,
    });
    rtc.localStream.init(
      function () {
        console.log("Init local stream success");
        rtc.localStream.play("local_stream");

        rtc.client.publish(rtc.localStream, function (err) {
          console.error("failed to publish stream ", err);
        });
      },
      function (err) {
        console.error("Failed to initialize local stream ", err);
      }
    );
  });
  RTMchannel = RTMclient.createChannel(channel_name); // messaging channel same as video
  RTMchannel.join()
    .then(() => {
      console.log("Joined Messaging Channel: " + channel_name);
    })
    .catch((error) => {
      console.log("Failed to Join Messaging Channel.");
    }); 
  // when user receives a channel message
  // text: text of the received channel message; senderId: user ID of the sender.
  RTMchannel.on('ChannelMessage', ({ text }, senderId) => { 
    console.log("Message received: " + text);
    console.log("Sender ID = " + senderId);
    addMessageToView(text, senderId);
  });
}

// when user wants to share their screen
// turnOn = true, user is currently not sharing screen, turn it on for them
function shareScreen() {
  // if currently sharing screen, switch back to Share Screen
  isSharingScreen
    ? (document.getElementById("share").innerHTML = "Share Your Screen")
    : (document.getElementById("share").innerHTML = "Disable Screenshare");
  isSharingScreen = !isSharingScreen;
  console.log(
    "Toggling sharing screen from " +
      !isSharingScreen +
      " to " +
      isSharingScreen
  );
  leaveChannel();
  setTimeout(() => {
    joinChannel(channel_name, isSharingScreen);
  }, 3000);
}

function sendMessage() {
  let msg = document.getElementById("usermsg").value;
  RTMchannel.sendMessage({ text: msg }).then(() => {
    addMessageToView(msg, username);
    }).catch(error => {
      console.log("Message failed to send.")
    });
}

function leaveChannel() {
  console.log("Left Video Channel");

  // disables all channel-related buttons
  document.getElementById("share").disabled = true;
  document.getElementById("submitmsg").disabled = true;
  document.getElementById("usermsg").disabled = true;
  document.getElementById("channel_name").innerHTML = "Current Room Name: ";
  document.getElementById("nickname_").innerHTML = "";

  // clears the message log
  document.getElementById('msg_log').innerHTML = "";
  
  // leaves the video channel
  rtc.client.leave(
    function () {
      rtc.localStream.stop();
      rtc.localStream.close();
      while (rtc.remoteStreams.length > 0) {
        var remoteStream = rtc.remoteStreams.shift();
        var id = remoteStream.getId();
        if (remoteStream.isPlaying()) {
          remoteStream.stop();
        }
        removeView(id);
      }
    },
    function (err) {
      console.error("channel leaving failed ", err);
    }
  );

  // leaves the messaging channel too
  RTMchannel.leave();
  console.log("Left Messaging Channel");
}

// 5/18/20 switching to having the user enter the channel name
function onFormSubmit() {
  let cname = document.getElementById("cname").value;
  if (!cname || cname.length > 20 || cname.length < 1) {
    alert("Invalid room name. Please try again.");
    return false;
  }
  joinChannel(cname, false);
}
