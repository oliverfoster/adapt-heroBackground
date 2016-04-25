define([
    "core/js/adapt",
    "../track",
    "../utils/inlineVideo"
], function(Adapt, Track) {

    var uid = 0;

    var MediaElementTrackView = Track.extend({

        renderOnChange: false,
        volume: 1,

        className: function() {
            return "inlinemediaelement-widget a11y-ignore-aria";
        },

        postInitialize: function(options) {
            this.parent = options.parent;
            this.uid = uid++;
            //this.listenTo(Adapt, "remove", this.remove);
            this.listenTo(Adapt, 'device:resize', this.onScreenSizeChanged);
            //this.listenTo(Adapt, "interactiveVideo:"+this.controllerUid+":scroll", this.onScreenSizeChanged);
        },

        preRender: function(isFirstRender) {
            if (!isFirstRender) return;
            console.log("prerender media", this.uid);

            var speed = "fast";
            if (speedtest) speed = speedtest.low_name;

            this.state.set("speed", speed);
        },

        postRender: function(isFirstRender) {
            if (!isFirstRender) return;
            console.log("poster media", this.uid);
            this.setupPlayer();
        },

        setupPlayer: function() {

            var modelOptions = {};
            modelOptions.success = _.bind(this.onPlayerReady, this);

            // create the player
            this.$('video').inlinevideo(modelOptions);
        },

        setupEventListeners: function() {
            $(this.mediaElement).on("play", _.bind(this.onEventFired, this));
            $(this.mediaElement).on("ended", _.bind(this.onEventFired, this));
            $(this.mediaElement).on('timeupdate', _.bind(this.onEventFired, this));
        },

        onEventFired: function(e) {
            if (this.isRemoved) return;
            switch (e.type) {
            case "timeupdate":
                var currentSeconds = Math.ceil(this.mediaElement.currentTime*10)/10;
                if (this.triggerSeconds !== currentSeconds) {
                    this.trigger("seconds", this, currentSeconds);
                    this.triggerSeconds = currentSeconds
                }
                break;
            case "ended":
                this.trigger("finish", this);
                break;
            case "play":
                this.trigger("play", this);
                break;
            default:
                debugger;
            }
        },

        play: function(seekTo) {
            if (this.hasPlayed && seekTo !== undefined) this.mediaElement.setCurrentTime(seekTo);
            if (!this.hasPlayed && seekTo !== undefined) {
                this.setCurrentSeconds(seekTo, true);
            } else {
                this.hasPlayed = true;
                this.mediaElement.play();
            }
        },

        setCurrentSeconds: function(seekTo, allowPlay) {
            if (this.hasPlayed && seekTo !== undefined) this.mediaElement.setCurrentTime(seekTo);
            if (!allowPlay) {
                this.mute();
            }
            this.mediaElement.play();
            this.once("play", _.bind(function() {
                this.mediaElement.setCurrentTime(seekTo);
                if (allowPlay) return;
                _.defer(_.bind(function() {
                    this.mediaElement.pause();
                }, this));
            }, this));
        },

        pause: function() {
            this.mediaElement.pause()
        },

        mute: function() {
            this.mediaElement.setVolume(0);
        },

        unmute: function() {
            this.mediaElement.setVolume(1);
        },

        isPaused: function() {
            return this.mediaElement.paused;
        },

        getVolume: function() {
            return this.volume;
        },

        setVolume: function(int) {
            this.volume = int;
            if (this.volume < 1) this.volume = 0;
            if (this.volume >= 1) this.volume = 1;
            this.mediaElement.setVolume(this.volume);
        },

        remove: function() {
            if (this.mediaElement) {
                $(this.mediaElement).remove();
                delete this.mediaElement;
            }
            Track.prototype.remove.call(this);
        },

        onPlayerReady: function (mediaElement) {
            this.mediaElement = mediaElement;

            this.setupEventListeners();

            this.trigger("ready", this);
        },

        onScreenSizeChanged: function() {
            if (!$("html").is(".in-fullscreen-view")) return;

            if ($.fn.inlinevideo.isiPhone) {
                setTimeout(function () { window.scrollTo(0, 0); window.scrollTo(0, 100); }, 1000);
            }
        },

        resize: function() {
            this.onScreenSizeChanged();
        }

    },{
        template: "bhv-mediaElement"
    });

    return MediaElementTrackView;

});
