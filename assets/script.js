/* Real-Time Messaging */
import AgoraRTM from "agora-rtm-sdk";
const RTMclient = AgoraRTM.createInstance("2758"); // YourAppId
RTMclient.on("ConnectionStateChange", (newState, reason) => {
  console.log(
    "on connection state changed to " + newState + " reason: " + reason
  );
});

// given the id of the user, adds a div for their view
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
    $("#nickname_container_" + id).append("<h5>" + username + "</h5>");

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

$(document).ready(function () {
  console.log("ready!");
});
// $("#join").click(joinChannel);
$("#leave").click(leaveChannel);

/** global variables */

var channel_name = "";

var username = "";

var isSharingScreen = false;

var rtc = {
  client: null, //The handle for the Agora client
  joined: false,
  published: false,
  localStream: null, //Our local video stream
  remoteStreams: [], //An array of remote video streams
  params: {}, //Any params we may want to pass to Agora
};

// Options for joining a channel
var option = {
  appID: "e435e4e68cb94a26900f3fbffee5ef09", // tells agora who you are as a user
  channel: "Mystery Room", // chat rooms
  uid: 0, // tells agora "we don't have our own user id, make one for us"
  token: null, // to identify user, security purposes, changed to null for now
};

// Create your client
rtc.client = AgoraRTC.createClient({
  mode: "rtc",
  codec: "h264", // common video codec optimized for web
});

rtc.client.init(
  option.appID,
  function () {
    console.log("init succ");
  },
  // catches any error
  function (err) {
    console.error("init failed");
  }
);

/* Channel Listeners */
// when the stream is added, get the Id and subscribe
rtc.client.on("stream-added", function (evt) {
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

// text: text of the received channel message; senderId: user ID of the sender.
channel.on('ChannelMessage', ({ text }, senderId) => { 
  console.log("Message received from " + sendMessage);
});

/** functions */

function joinChannel(cname, videoOn) {
  console.log("Joined rtc channel: " + cname);
  channel_name = cname;
  document.getElementById("share").disabled = false;
  // displaying channel name, checking if first person or not
  document.getElementById("channel_name").innerHTML =
    "Current Room Name: " + cname;
  username = prompt("Please enter your name:", "");
  document.getElementById("nickname_").innerHTML = username;

  rtc.client.join(option.token, channel_name, option.uid, function (uid) {
    rtc.params.uid = uid;
    // enable user permissions
    rtc.localStream = AgoraRTC.createStream({
      streamID: rtc.params.uid,
      audio: !videoOn,
      video: !videoOn,
      screen: videoOn,
    });
    // initalized after creating stream
    // note: mirrored images = standard practice for video conf.
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

  // login as a client of Real time Messaging
  RTMclient.login({ token: null, uid: 0 })
    .then(() => {
      console.log("AgoraRTM client login success");
    })
    .catch((err) => {
      console.log("AgoraRTM client login failure", err);
    });
  const RTMchannel = RTMclient.createChannel(channel_name); // messaging channel same as video
  RTMchannel.join()
    .then(() => {
      console.log("Joined Messaging Channel.");
    })
    .catch((error) => {
      console.log("Failed to Join Messaging Channel.");
    });
}

// when user wants to share their screen
// turnOn = true, user is currently not sharing screen, turn it on for them
function shareScreen() {
  // if currently sharing screen, switch back to Share Screen
  isSharingScreen
    ? (document.getElementById("share").innerHTML = "Share Your Screen")
    : (document.getElementById("share").innerHTML = "Disable Sharing Screen");

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

function sendMessage(msg) {
  RTMchannel.sendMessage({ text: msg }).then(() => {
      console.log("Message sent in channel.")
    }).catch(error => {
      console.log("Message failed to send.")
    });
}

function leaveChannel() {
  console.log("Left channel");
  document.getElementById("share").disabled = true;
  document.getElementById("channel_name").innerHTML = "Current Room Name: ";
  document.getElementById("nickname_").innerHTML = "";
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
  channel.leave();
  RTMclient.logout();
}

// switching to having the user enter the channel name
function onFormSubmit(event) {
  let cname = document.getElementById("cname").value;
  if (!cname || cname.length > 10 || cname.length < 1) {
    alert("Invalid room name. Please try again.");
    return false;
  }
  joinChannel(cname, false);
}
