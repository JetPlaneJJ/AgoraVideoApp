function addView(id, show) {
  if (!$("#" + id)[0]) {
    $("<div/>", {
      id: "remote_video_panel_" + id,
      class: "video-view",
    }).appendTo("#video");

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

$("#join").click(joinChannel);

$("#leave").click(leaveChannel);

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
  appID: "APP_ID_HERE",
  channel: "test",
  uid: 0,
  token: "TOKEN",
};

rtc.client = AgoraRTC.createClient({ mode: "rtc", codec: "h264" });

rtc.client.init(
  option.appID,
  function () {
    console.log("init success");
  },
  function (err) {
    console.error("init failed ", err);
  }
);

rtc.client.on("stream-added", function (evt) {
  var remoteStream = evt.stream;
  var id = remoteStream.getId();

  if (id !== rtc.params.uid) {
    rtc.client.subscribe(remoteStream, function (err) {
      console.error("Failed to subscribe to remote stream ", err);
    });
  }

  console.log("stream-added remote-uid: ", id);
});

rtc.client.on("stream-subscribed", function (evt) {
  var remoteStream = evt.stream;
  var id = remoteStream.getId();

  addView(id);
  remoteStream.play("remote_video_" + id);

  rtc.remoteStreams.push(remoteStream);

  console.log("stream-subscribed remote-uid ", id);
});

rtc.client.on("stream-removed", function (evt) {
  var remoteStream = evt.stream;
  var id = remoteStream.getId();

  if (remoteStream.isPlaying()) {
    remoteStream.stop();
  }

  removeView(id);

  rtc.remoteStreams = rtc.remoteStreams.filter((item) => item.getId() !== id);

  console.log("stream-removed remote-uid ", id);
});

rtc.client.on("peer-leave", function (evt) {
  var id = evt.uid;

  removeView(id);

  rtc.remoteStreams = rtc.remoteStreams.filter((item) => item.getId() !== id);

  console.log("peer-leave remote-uid ", id);
});

function joinChannel() {
  console.log("Joined rtc channel");
  rtc.client.join(option.token, option.channel, option.uid, function (uid) {
    rtc.params.uid = uid;

    rtc.localStream = AgoraRTC.createStream({
      streamID: rtc.params.uid,
      audio: false,
      video: true,
      screen: false,
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
}

function leaveChannel() {
  console.log("Left rtc channel");

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
      console.error("channel leave failed ", err);
    }
  );
}
