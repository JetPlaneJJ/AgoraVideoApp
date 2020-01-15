
function addView(id, show) {
    if (!$('#' + id)[0]) {
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

$( document ).ready(function() {
    console.log( "ready!" );
});

$("#join").click(joinChannel);

$("#leave").click(leaveChannel);

var rtc = {
    client: null,
    joined: false,
    published: false,
    localStream: null,
    remoteStreams: [],
    params: {}
};

// Options for joining a channel
var option = {
    appID: "APP_ID",
    channel: "test",
    uid: 0,
    token: "TOKEN"
};

function joinChannel() {
    console.log("Joined rtc channel");
}

function leaveChannel() {
    console.log("Left rtc channel");
}
