define([
    "core/js/adapt",
    "./utils/diffView"
], function(Adapt, DiffView) {

    var TrackView = DiffView.extend({

        resize: function() {},

        play: function(seekTo) {},

        setCurrentSeconds: function(seekTo) {},

        pause: function() {},

        mute: function() {},

        unmute: function() {},

        isPaused: function() {},

        getVolume: function() {},

        setVolume: function(int) {}

    });

    return TrackView;

});
