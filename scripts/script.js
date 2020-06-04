/**
  Name: Jay Lin
  Last Updated: 06.03.2020  
  Script for handling Agora's RTM and RTC client as well as other website functionality.
**/

var channel_name = ""; // name of channel user is currently in
var newID = ""; // represents peer messager IDs
var username = ""; // represents user's current username or display name
var user_msg_id = ""; // represents user's current username for messaging
var isSharingScreen = false; 
var rtc = {
  client: null, // video client
  screenClient: null,
  joined: false,
  published: false,
  localStream: null, // Our local video stream
  remoteStreams: [], // An array of remote video streams
  params: {}, // Any parameters we may want to pass to Agora
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

/** Adds Video Views inside the video container whenever user joins or leave.
 * @param {Number} id - ID of the video being added or removed from container.
 */
function addView(id) {
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

/** Removes Video Views inside the video container whenever user joins or leave.
 * @param {Number} id - ID of the video being added or removed from container.
 */
function removeView(id) {
  if ($("#remote_video_panel_" + id)[0]) {
    $("#remote_video_panel_" + id).remove();
  }
}
/** Adds messages to the chat log.
 * @param {String} msg - represents the message being sent by the user.
 */
function addMessageToView(msg, sender) {
  console.log("Message being sent = " + msg);
  document.getElementById("msg_log").innerHTML +=
    "<h6>" + sender + ": " + msg + "</h6>";
}

// Handles welcome message and username input.
$(document).ready(function () {
  console.log("ready!");
  let checkValid = true;
  while (checkValid) {
    var input = prompt(
      "Please enter a username you would like to go by: ",
      ""
    );
    if (!input || input.length < 1 || input.length > 20 || !isValid(input)) {
      if (confirm("Invalid or empty input. Please do not use special characters." + 
      " Press OK to use a random username. Cancel to re-enter desired username.")) {
        input = "USER" + Math.round(1 + Math.random() * 100000);
        checkValid = false;
      }
    }
    else {
      checkValid = false;
    }
  }
  username = input;
  user_msg_id = username;
  document.getElementById("display_name").innerHTML =
    "Username: " + input;
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

// Initializes Agora Real Time Video Client
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
// Initializes Agora Real Time Screen Client, TODO: maybe fix this
// rtc.screenClient = AgoraRTC.createClient({
//   mode: "rtc",
//   codec: "vp8", // common video codec optimized for web
// });

// RTM and RTC Listeners 
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
  // console.log("stream-subscribed remote-uid ", id);
  // document.getElementById("nickname_container_" + 
  //     rtc.remoteStreams.length).innerHTML = "<h5>" + newID + "</h5>";
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

/** Toggles the appearance of buttons involved with channel communication.
 * @param {boolean} bool - If true, disables all buttons involved with channel communication.
 */
function toggleEnable(bool) {
  document.getElementById("share").disabled = bool;
  document.getElementById("submitmsg").disabled = bool;
  document.getElementById("usermsg").disabled = bool;
  document.getElementById("startSpeechToText").disabled = bool;
  document.getElementById("leave").disabled = bool;
  document.getElementById("join").disabled = !bool;
  document.getElementById("cname").disabled = !bool;
}

/** Handles functionality for joining a channel.
 * @param {String} cname - Represents the channel name.
 * @param {bool} videoOn - Is true if the user wishes to share their video and 
 *    disable screen share.
 */
function joinChannel(cname, videoOn) {
  console.log("Joined rtc channel: " + cname);
  channel_name = cname;
  toggleEnable(false);

  document.getElementById("channel_name").innerHTML =
    "Room Name: " + cname;
  document.getElementById("nickname_").innerHTML = username;
  document.getElementById("usermsg").placeholder = "Enter a Message to Send";

  // User joining with Video or Screen depending on videoOn
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
  // Real Time Messaging Channel
  RTMchannel = RTMclient.createChannel(channel_name);
  RTMchannel.join()
    .then(() => {
      console.log("Joined Messaging Channel: " + channel_name);
    })
    .catch((error) => {
      console.log("Failed to Join Messaging Channel.");
    });

  // Handles receiving messages from peers in the same channel
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

// Handles functionality for sharing user screen and toggling share butotn.
function shareScreen() {
  isSharingScreen
    ? (document.getElementById("share").innerHTML = "Share Your Screen")
    : (document.getElementById("share").innerHTML = "Share Your Video");
  leaveChannel();
  setTimeout(function() { 
    joinChannel(channel_name, !isSharingScreen); }, 1000);
  isSharingScreen = !isSharingScreen; // switching from not sharing to sharing
}

// Sends a message to peers and adds message to chat log.
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
      addMessageToView("(Message failed to send. Try leaving and re-entering the room.)", "System");
    });
}

// Leaves the channel and clears all channel-related content.
function leaveChannel() {
  // if you click leave while still sharing your video, reset appearance
  if (isSharingScreen) {
    document.getElementById("share").innerHTML = "Share Your Screen";
    isSharingScreen = false;
  }
  console.log("Left Video Channel");
  toggleEnable(true);
  document.getElementById("channel_name").innerHTML = "Room Name: ";
  document.getElementById("nickname_").innerHTML = "";
  document.getElementById("usermsg").placeholder =
    "Join a Room to Send Messages";
  document.getElementById("msg_log").innerHTML = ""; // clears the message log

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
  RTMchannel.leave();
  console.log("Left Messaging Channel");
}

// Handles functionality for joining channels by name.
function onFormSubmit() {
  let cname = document.getElementById("cname").value;
  if (!cname || cname.length > 20 || cname.length < 1 || !isValid(cname)) {
    alert("Invalid or empty room name. Please use non-special characters.");
    return false;
  }
  joinChannel(cname, false);
  document.getElementById("cname").value = "";
}

/** Tests a String for special characters using regular expressions
 * @param {String} str - represents a String to be tested for special characters.
 *    Returns true if it does not contain any special characters.
 */ 
function isValid(str){
  return !/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(str);
}