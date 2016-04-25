'use strict';

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node/CommonJS
        module.exports = function( root, jQuery ) {
            if ( jQuery === undefined ) {
                // require('jQuery') returns a factory that requires window to
                // build a jQuery instance, we normalize how we use modules
                // that require this pattern but the window provided is a noop
                // if it's defined (how jquery works)
                if ( typeof window !== 'undefined' ) {
                    jQuery = require('jquery');
                }
                else {
                    jQuery = require('jquery')(root);
                }
            }
            factory(jQuery);
            return jQuery;
        };
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {

    //RAF
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = (function() {
            return window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function( callback, element ) {
                    return window.setTimeout( callback, 1000 / 60 );
                };
        })();
    }
    if (!window.cancelRequestAnimationFrame) {
        window.cancelRequestAnimationFrame = (function() {
            return window.webkitCancelRequestAnimationFrame ||
                window.mozCancelRequestAnimationFrame ||
                window.oCancelRequestAnimationFrame ||
                window.msCancelRequestAnimationFrame ||
                clearTimeout;
        })();
    }

    var extend = function(a,b) {
        for (var k in b) {
            a[k] = b[k];
        }
        return a;
    };

    //APPLE iPhone/iOS Detection
    var APPLE_DETECTION = {
        initialize: function() {
            this.ua = window.navigator.userAgent.toLowerCase();
            this.isiPad = (this.ua.match(/ipad/i) !== null);
            this.isiPhone = (this.ua.match(/iphone/i) !== null);
            this.isBlackBerry10 = (this.ua.match(/bb10/i) !== null);
            this.isiOS = this.isiPhone || this.isiPad;
            this.version = parseFloat(
                ('' + (/CPU.*OS ([0-9_]{1,5})|(CPU like).*AppleWebKit.*Mobile/i.exec(this.ua) || [0,''])[1])
                .replace('undefined', '3_2').replace('_', '.').replace('_', '')
            ) || false;
            delete this.initialize;
        }

    };
    APPLE_DETECTION.initialize();

    //INLINE VIDEO ELEMENT
    window.InlineVideo = function InlineVideo(videoElement) {
        var inlineVideoElement = document.createElement('inlinevideo');
        inlineVideoElement._videoElement = videoElement;
        $.extend(inlineVideoElement, InlineVideo.prototype);
        return InlineVideo.initialize.call(inlineVideoElement);
    };

    extend(InlineVideo, {

        initialize: function() {
        
            this._wasPlayClicked = false;
            this._lastTime = 0;
            this._lastTriggerTime = 0;
            this._videoElement.playbackRate = 2;
            
            // replace the video with inlineVideo element
            $(this).addClass('inlinevideocontainer');
            $(this._videoElement).addClass("inlined").replaceWith(this).removeAttr("style");
            this._$ = $(this);
            this._$.append(this._videoElement);

            this._audioElem = document.createElement('audio');
            $(this._audioElem).attr("controls", "false");
            this._audioElem.src = $(this._videoElement).find("source[type='video/mp4']").attr("src")+".mp3";

            var player = [this._audioElem];
            this._$.append(player);

            var __ = this;

            this._videoElement.onloadstart = function() {

            }; // fires when the loading starts
            this._videoElement.onloadedmetadata = function() { 

                __._metaLoaded = true;
                if (__._wasPlayClicked) {
                    //if meta is loaded with play click
                    __._isLoaded = true;
                    __.play();
                }

            }; //  when we have metadata about the video
            this._videoElement.onloadeddata = function() {

            }; // when we have the first frame
            this._videoElement.onprogress = function() { 

                if (!__._isLoaded) return;
                var end = __._videoElement.buffered.end(0);
                var sofar = parseFloat(((end / __._videoElement.duration) * 100));

                //add waiting icon in here
            };

            return this;
        },

        playLoop: function() {
            var __ = this;
            var time = Date.now();
            var elapsed = (time - this._lastTime) / 1000;

            if (this.currentTime === undefined) this.currentTime = 0;

            // render
            if(elapsed >= (1/25)) {
                var currentTime = this.currentTime + elapsed;
                var outByTime = Math.abs(this._audioElem.currentTime - currentTime);
                if (outByTime > 1) {
                    //skip audio if out of sync
                    this._audioElem.currentTime = currentTime;
                }
                //seek video
                this._videoElement.currentTime = currentTime;
                this._lastTime = time;
                this.currentTime = this._audioElem.currentTime;
            }

            var triggerElapsed = (time - this._lastTriggerTime) / 1000;
            if (triggerElapsed >= 1/4) {
                setTimeout(function() {
                    $(__).triggerHandler("timeupdate")
                }, 0);
                this._lastTriggerTime = time;
            }

            // if we are at the end of the video stop
            var currentTime = (Math.round(parseFloat(this._videoElement.currentTime)*10000)/10000);
            var duration = (Math.round(parseFloat(this._videoElement.duration)*10000)/10000);
            if(currentTime >= duration) {
                this.pause();
                $(this).triggerHandler("ended");
                return;
            }

            this._animationRequest = requestAnimationFrame(function() {
                InlineVideo.playLoop.call(__);
            });
        }

    });

    extend(InlineVideo.prototype, {

        volume: 1,

        paused: true,

        play: function(e) { 
            //can only be run from click
            this._wasPlayClicked = true;

            if (this._metaLoaded && !this._isLoaded) {
                //if meta loaded but play not clicked
                this._videoElement.play();
                this._videoElement.pause();
                this._videoElement.currentTime = 0;
                this._isLoaded = true;
            }

            if (!this._isLoaded) {
                //meta not captured on startup, load meta data
                this._videoElement.load();

                //mske sure to play the audio on click
                this._audioElem.currentTime = 0;
                this._audioElem.play();
                this._audioElem.pause();
                this._audioElem.currentTime = 0;
                return;
            }

            this._lastTime = Date.now();
            var __ = this;
            if (this.volume === 1) {
                this._audioElem.play();
            }
            
            this._animationRequest = requestAnimationFrame(function() {
                InlineVideo.playLoop.call(__);
            });

            setTimeout(function() {
                __.paused = false;
                $(__).triggerHandler("play")
            }, 0);

        },

        pause: function() {
            cancelAnimationFrame(this._animationRequest);
            this._animationRequest = null;
            this._audioElem.pause();
            this.paused = true;
            var __ = this;
            setTimeout(function() {
                $(__).triggerHandler("pause")
            }, 0);
        },

        setCurrentTime: function(seconds) {
            this._videoElement.currentTime = seconds;
            this._audioElem.currentTime = seconds;
        },

        mute: function() {
            this.volume = 0;
            this._audioElem.pause();
        },

        unmute: function() {
            this.volume = 1;
            if (!this.paused) {
                this._audioElem.play();
            }
        },

        isPaused: function() {
            return this.paused;
        },

        getVolume: function() {
            return this.volume;
        },

        setVolume: function(int) {
            if (int < 1) this.volume = 0;
            if (int >= 1) this.volume = 1;
            if (this.volume === 0) {
                this._audioElem.pause();
            }
        }

    });

    //Inline video styling
    var injectStyling = function() {
        //hide user controls
        if(!$("style.inlinevideo").length) {
            $("head").append("<style class='inlinevideo'>inlinevideo { display:inline-block; position:relative; } inlinevideo video {width:100%;height:auto;} inlinevideo audio {display:none;} video.inlined::-webkit-media-controls {display: none !important;} video.inlined::-webkit-media-controls-start-playback-button { display: none !important;-webkit-appearance: none;} </style>");
        }
    };

    $.fn.inlinevideo = function(options) {
        if (!((APPLE_DETECTION.isiPhone && APPLE_DETECTION.version > 8) || true)) return false;
        
        var $this = $(this);
        var $items = $([]);

        $items = $items.add($this.find("video:not(.inlined)"));
        $items = $items.add($this.filter("video:not(.inlined)"));

        $items.each(function(index, item) {

            injectStyling();
            
            $(item).addClass("inlinevideo");

            var inlineVideo = new InlineVideo(item);
            if (typeof options.success === "function") options.success(inlineVideo, options);

        });



        return true;
    };

    extend($.fn.inlinevideo, APPLE_DETECTION);

}));
