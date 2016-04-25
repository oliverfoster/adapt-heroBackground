define([
    'coreJS/adapt',
    './utils/diffView',
    './tracks/inlineMediaElement',
    './tracks/mediaElement',
    './tracks/still'
],function(Adapt, DiffView, InlineMediaElement, MediaElement, Still) {


	var Tracks = DiffView.extend({

		tracksUrlIndex: null,
		tracks: null,
		currentTrack: null,

		className: function() {
			return "herobackground-tracks";
		},

		initialize: function(options) {
			this.tracksUrlIndex = {};
			this.tracks = [];

			this.setUpEventListeners();
			this.render();
		},

		setUpEventListeners: function() {
			this.listenTo(Adapt, { 
				"router:menu": this.onRouteMenu,
				"router:page": this.onRoutePage,
				"remove": this.onRouteRemove
			}, this);
		},

		postRender: function() {
			this.setUpChildren();
		},

		setUpChildren: function() {
			var tracks = this.model.get("tracks");

			for (var i = 0, l = tracks.length; i < l; i++) {

				var url = tracks[i];

				if (this.tracksUrlIndex[url]) continue;

				var trackView;
				switch ($.fn.inlinevideo.isiPhone) {
				case true:
					trackView = new InlineMediaElement({
						model: new Backbone.Model({
							_media: {
								mp4: url
							}
						})
					});
					break;
				default:
					trackView = new MediaElement({
						model: new Backbone.Model({
							_media: {
								mp4: url
							}
						})
					});
				}

				this.tracksUrlIndex[url] = trackView;
				this.tracks.push(trackView);

				this.$(".herobackground-track-"+i).append(trackView.$el);

				this.listenTo(trackView, "finish", function() {
					trackView.play();
				});
			}

			this.currentTrack = this.tracks[0];

			this.listenToOnce(this.currentTrack, "ready", _.bind(function() {
				this.currentTrack.play();
			}, this));

		},

		play: function() {
			this.currentTrack.play();
		}

	},{
		template: "bhv-tracks"
	});

	return Tracks;

});