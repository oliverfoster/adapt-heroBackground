define([
    "core/js/adapt",
    "../track"
], function(Adapt, Track) {

    var StillView = Track.extend({

        renderOnChange: false,

        seconds: 0,
        triggerSeconds: 0,
        _isPaused: true,
        _isPlayTriggered: false,
        timeAtPlay: 0,

        className: function() {
            return "still-widget a11y-ignore-aria";
        },

        postInitialize: function(options) {
            this.parent = options.parent;
            this.listenTo(Adapt, "interactiveVideo:"+this.controllerUid+":resize", this.onScreenSizeChanged);
        },

        onTick: function() {
            if (this._isPaused) return clearInterval(this.timer);

            this.seconds += (((new Date()).getTime() - this.timeAtPlay) / 1000);

            if (!this._isPlayTriggered) return;

            var currentSeconds = this.seconds;
            var lengthSeconds = this.model.get("lengthSeconds");
            if (currentSeconds >= lengthSeconds) {
                this.triggerSeconds = lengthSeconds
                this.trigger("seconds", this, lengthSeconds);
                this.pause();
                this.trigger("finish", this);
            }
            if (this.triggerSeconds !== currentSeconds) {
                this.trigger("seconds", this, currentSeconds);
                this.triggerSeconds = currentSeconds
            }
        },

        preRender: function(isFirstRender) {
            if (!isFirstRender) return;
            this.listenTo(Adapt, 'device:resize', this.onScreenSizeChanged);
            this.listenTo(Adapt, 'remove', this.remove);
        },

        postRender: function(isFirstRender) {
            if (!isFirstRender) return;
            this.$el.imageready(_.bind(function(){
                this.resize();
                this.trigger("ready", this);
            }, this));
        },

        onScreenSizeChanged: function() {

        },

        resize: function() {
            this.onScreenSizeChanged();
        },

        play: function(seekTo) {
            if (seekTo) {
                //todo: do this logic
                debugger;
            }
            this._isPlayTriggered = false;
            this.timer = setInterval(_.bind(this.onTick, this), 100);
            this.timeAtPlay = (new Date()).getTime();
            this._isPaused = false;
            _.defer(_.bind(function() {
                this._isPlayTriggered = true;
                this.trigger("play", this);
            }, this));
        },

        setCurrentSeconds: function(seekTo) {
            //todo: do this logic
            debugger;
        },

        pause: function() {
            this._isPaused = true;
            this._isPlayTriggered = false;
            clearInterval(this.timer);
        },

        mute: function() {

        },

        unmute: function() {

        },

        isPaused: function() {
            return this._isPaused;
        },

        getVolume: function() {
            return 1;
        },

        setVolume: function(int) {

        }

    },{
        template: "bhv-still"
    });

    return StillView;

});
