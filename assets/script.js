/**
  Name: Jay Lin
  Last Updated: 05.21.2020  
  This is the script for handling Agora's RTM and RTC client as well as other website
  functionality.
**/

/** global variables and fields */
var channel_name = "";
var newID = "";
var username = "";
var user_msg_id = "";
var isSharingScreen = false;
var rtc = {
  client: null, //The handle for the Agora client
  joined: false,
  published: false,
  localStream: null, //Our local video stream
  remoteStreams: [], //An array of remote video streams
  params: {}, //Any params we may want to pass to Agora
};
var RTMchannel; // channel for Real Time Messaging
// Options for joining a channel
var option = { 
  appID: "e435e4e68cb94a26900f3fbffee5ef09",
  channel: "Mystery Room", // chat rooms
  uid: 0, // tells agora "we don't have our own user id, make one for us"
  token: null, // to identify user, security purposes, changed to null for now
};
const RTMclient = AgoraRTM.createInstance("6669f3e9d71b42ed8fabfbc3a2146ba1");

/** Adding views to HTML */
function addView(id, show) {
  console.log("id is " + id);
  let numVid = rtc.remoteStreams.length + 1;
  console.log("in addView: " + numVid);
  if (!$("#" + id)[0]) {
    // the video itself
    $("<section/>", {
      id: "remote_video_panel_" + id,
      class: "video-view",
    }).appendTo("#video");

    // the container upper bar for the name
    $("<div/>", {
      id: "nickname_container_" + numVid,
      class: "agora-primary-bg",
    }).appendTo("#remote_video_panel_" + id);

    $("<div/>", {
      id: "nickname_" + id,
    }).appendTo("#nickname_container_" + id);

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
  document.getElementById("msg_log").innerHTML +=
    "<h6>" + sender + ": " + msg + "</h6>";
}

/** jQuery stuff */
$(document).ready(function () {
  console.log("ready!");
  let input = prompt(
    "Welcome to Mystery Video App! Please enter your name: ",
    ""
  );
  if (!input || input.length < 1 || input.length > 20) {
    input = "USER" + Math.round(1 + Math.random() * 100000);
    alert(
      "Invalid or empty input. Using random username: " +
        input +
        ". Refresh the page to change display name."
    );
  }
  username = input;
  user_msg_id = input;
  document.getElementById("display_name").innerHTML =
    "Current Display Name: " + input;
  // login as a client of Real time Messaging
  RTMclient.login({ token: null, uid: "" + user_msg_id })
    .then(() => {
      console.log("AgoraRTM client login success: userID = " + user_msg_id);
    })
    .catch((err) => {
      console.log("AgoraRTM client login failure", err);
    });
});
$("#leave").click(leaveChannel);

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

/* Listeners */
RTMclient.on("ConnectionStateChange", (newState, reason) => {
  console.log(
    "on connection state changed to " + newState + " reason: " + reason
  );
});
rtc.client.on("stream-added", function (evt) {
  // stream added, get the Id, subscribe
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
  let remoteStream = evt.stream;
  let id = remoteStream.getId();
  addView(id);
  remoteStream.play("remote_video_" + id);
  rtc.remoteStreams.push(remoteStream);
  console.log("in the stream subscribed method: " + rtc.remoteStreams.length);
  console.log("stream-subscribed remote-uid ", id);
  document.getElementById("nickname_container_" + 
      rtc.remoteStreams.length).innerHTML = "<h5>" + newID + "</h5>";
});
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
function toggleEnable(bool) {
  document.getElementById("share").disabled = bool;
  document.getElementById("submitmsg").disabled = bool;
  document.getElementById("usermsg").disabled = bool;
  document.getElementById("startSpeechToText").disabled = bool;
}

function joinChannel(cname, videoOn) {
  console.log("Joined rtc channel: " + cname);
  channel_name = cname;

  // re-enable all buttons
  toggleEnable(false); // pass in false to make .disabled false

  // display channel name, checking if first person or not
  document.getElementById("channel_name").innerHTML =
    "Current Room Name: " + cname;
  document.getElementById("nickname_").innerHTML = username;
  document.getElementById("usermsg").placeholder = "Enter a Message to Send";

  rtc.client.join(option.token, channel_name, option.uid, function (uid) {
    rtc.params.uid = uid;
    rtc.localStream = AgoraRTC.createStream({
      // enable user permissions
      streamID: rtc.params.uid,
      audio: true,
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
  RTMchannel.on("ChannelMessage", ({ text }, senderId) => {
    console.log("Message received: " + text);
    console.log("Sender ID = " + senderId);
    addMessageToView(text, senderId);
    let msglog = document.getElementById("msg_log");
    msglog.scrollTop = msglog.scrollHeight; // auto scrolling
  });
  // When someone joins the messaging channel
  RTMchannel.on("MemberJoined", (memberId) => {
    // check memberId is intended username
    console.log(memberId + " has joined!");
    console.log(rtc.remoteStreams.length);
    newID = memberId;
  });
  RTMchannel.on("MemberLeft", (memberId) => {
    console.log(memberId + " has left :( ");
  });
}

// turnOn = true, user is currently not sharing screen
// if currently sharing screen, switch back to Share Screen
function shareScreen() {
  isSharingScreen
    ? (document.getElementById("share").innerHTML = "Share Your Screen")
    : (document.getElementById("share").innerHTML = "Disable Screenshare");
  isSharingScreen = !isSharingScreen;
  leaveChannel();
  setTimeout(() => {
    joinChannel(channel_name, isSharingScreen);
  }, 500);
}

function sendMessage() {
  let msg = document.getElementById("usermsg").value;
  RTMchannel.sendMessage({ text: msg })
    .then(() => {
      addMessageToView(msg, username);
      document.getElementById("usermsg").value = "";
      let msglog = document.getElementById("msg_log");
      msglog.scrollTop = msglog.scrollHeight; // auto scrolling
    })
    .catch((error) => {
      console.log("Message failed to send: " + error);
    });
}

function leaveChannel() {
  console.log("Left Video Channel");

  // disables all channel-related buttons
  toggleEnable(true);
  document.getElementById("channel_name").innerHTML = "Current Room Name: ";
  document.getElementById("nickname_").innerHTML = "";
  document.getElementById("usermsg").placeholder =
    "Join a Room to Send Messages";

  // clears the message log
  document.getElementById("msg_log").innerHTML = "";

  // leaves the video channel
  rtc.client.leave(
    function () {
      rtc.localStream.stop();
      rtc.localStream.close();
      while (rtc.remoteStreams.length > 0) {
        var remoteStream = rtc.remoteStreams.shift();
        let id = remoteStream.getId();
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

function onFormSubmit() {
  let cname = document.getElementById("cname").value;
  if (!cname || cname.length > 20 || cname.length < 1 || cname == "`") {
    alert("Invalid room name. Please try again.");
    return false;
  }
  joinChannel(cname, false);
  document.getElementById("cname").value = "";
}