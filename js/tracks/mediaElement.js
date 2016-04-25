define([
    "core/js/adapt",
    "../track"
], function(Adapt, Track) {

    var mep_defaults = {
        "poster": "",
        "showPosterWhenEnded": false,
        "defaultVideoWidth": 480,
        "defaultVideoHeight": 270,
        "videoWidth": -1,
        "videoHeight": -1,
        "defaultAudioWidth": 400,
        "defaultAudioHeight": 30,
        "defaultSeekBackwardInterval": "(media.duration * 0.05)",
        "defaultSeekForwardInterval": "(media.duration * 0.05)",
        "audioWidth": -1,
        "audioHeight": -1,
        "startVolume": 1,
        "loop": false,
        "autoRewind": false,
        "enableAutosize": true,
        "alwaysShowHours": false,
        "showTimecodeFrameCount": false,
        "framesPerSecond": 12.5,
        "autosizeProgress" : true,
        "alwaysShowControls": false,
        "hideVideoControlsOnLoad": true,
        "clickToPlayPause": false,
        "iPadUseNativeControls": false,
        "iPhoneUseNativeControls": false,
        "AndroidUseNativeControls": false,
        "features": [],
        "isVideo": true,
        "enableKeyboard": true,
        "pauseOtherPlayers": false,
        "startLanguage": "",
        "tracksText": "",
        "hideCaptionsButtonWhenEmpty": true,
        "toggleCaptionsButtonWhenOnlyOne": false,
        "slidesSelector": ""
    };

    var uid = 0;

    var MediaElementTrackView = Track.extend({

        renderOnChange: false,

        className: function() {
            return "mediaelement-widget a11y-ignore-aria";
        },

        postInitialize: function(options) {
            this.parent = options.parent;
            this.uid = uid++;
            //this.listenTo(Adapt, "remove", this.remove);
            this.listenTo(Adapt, 'device:resize', this.onScreenSizeChanged);
            this.listenTo(Adapt, "interactiveVideo:"+this.controllerUid+":scroll", this.onScreenSizeChanged);
        },

        preRender: function(isFirstRender) {
            if (!isFirstRender) return;
            console.log("prerender media", this.uid);

            var speed = "fast";
            if (window.speedtest) speed = window.speedtest.low_name;

            this.state.set("speed", speed);
        },

        postRender: function(isFirstRender) {
            if (!isFirstRender) return;
            console.log("poster media", this.uid);
            this.setupPlayer();
        },

        setupPlayer: function() {
            if (!this.model.get('_playerOptions')) this.model.set('_playerOptions', {});

            var modelOptions = _.extend({}, mep_defaults);

            modelOptions.pluginPath = 'assets/';

            if (this.model.get("features")) modelOptions.features = this.model.get("features");

            modelOptions.success = _.bind(this.onPlayerReady, this);

            if (this.model.get('_autoRewind')) {
                modelOptions.autoRewind = true;
            }

            if (this.model.get('_useClosedCaptions')) {
                modelOptions.startLanguage = this.model.get('_startLanguage') === undefined ? 'en' : this.model.get('_startLanguage');
            }

            this.addMediaTypeClass();

            // create the player
            this.$('audio, video').mediaelementplayer(modelOptions);

            // We're streaming - set ready now, as success won't be called above
            if (this.model.get('_media').source) {
                this.$('.media-widget').addClass('external-source');
                this.setReadyStatus();
            }
        },

        addMediaTypeClass: function() {
            var media = this.model.get("_media");
            if (media.type) {
                var typeClass = media.type.replace(/\//, "-");
                this.$(".media-widget").addClass(typeClass);
            }
        },

        setupEventListeners: function() {
            this.mediaElement.addEventListener("start", _.bind(this.onEventFired, this));
            this.mediaElement.addEventListener("play", _.bind(this.onEventFired, this));
            this.mediaElement.addEventListener("ended", _.bind(this.onEventFired, this));
            this.mediaElement.addEventListener('timeupdate', _.bind(this.onEventFired, this));
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
                if ($("html").is(".iPhone")) {
                    this.$("video")[0].webkitExitFullScreen();
                }
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
            this.hasPlayed = true;
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
            this.mediaElement.pause();
            if ($("html").is(".iPhone")) {
                this.$("video")[0].webkitExitFullScreen();
            }
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
            return this.mediaElement.volume;
        },

        setVolume: function(int) {
            this.mediaElement.setVolume(int);
        },

        remove: function() {
            if ($("html").is(".ie8")) {
                var obj = this.$("object")[0];
                if (obj) {
                    obj.style.display = "none";
                }
            }
            if (this.mediaElement) {
                $(this.mediaElement.pluginElement).remove();
                delete this.mediaElement;
            }
            Track.prototype.remove.call(this);
        },

        onPlayerReady: function (mediaElement, domObject) {
            this.mediaElement = mediaElement;

            if (!this.mediaElement.player) {
                this.mediaElement.player =  mejs.players[this.$('.mejs-container').attr('id')];
            }

            delete mejs.players[this.mediaElement.player.id];

            this.setupEventListeners();

            if ($("html").is(".iOS, .iPhone, .iPad")) {
                this.$("video");
            }

            this.$(".mejs-container").addClass("iv-background-color");

            this.trigger("ready", this);
        },

        onScreenSizeChanged: function() {
            
            if ($("html").is(".ie8")) {
                if (this.parent && this.parent.state) {
                    if (this.parent.state.get("isWiderRatio")) {
                        this.$el.css({
                            "max-width": this.parent.state.get("width")
                        });
                    } else {
                        this.$el.css({
                            "max-width": ""
                        });   
                    }
                }
                
                _.delay(_.bind(function() {
                    if (this.isRemoved) return;
                    if (this.parent && this.parent.state) {
                        if (this.parent.state.get("isWiderRatio")) {
                            this.$el.css({
                                "max-width": this.parent.state.get("width")
                            });
                        } else {
                            this.$el.css({
                                "max-width": ""
                            });
                        }
                    }
                }, this), 0);
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
