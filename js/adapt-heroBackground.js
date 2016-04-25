define([
    'coreJS/adapt',
    './tracks'
],function(Adapt, Tracks) {


	var HeroBackground = Backbone.View.extend({

		tracksView: null,

		initialize: function(options) {
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

		render: function() {
			if (this.tracksView !== null) return;

			this.tracksView = new Tracks({
				model: new Backbone.Model({
					tracks: [
						"assets/bhv-example1.mp4"
					]
				})
			});

			this.$el.prepend(this.tracksView.$el);

		},

		onRouteMenu: function(model) {

		},

		onRoutePage: function(model) {

		},

		onRouteRemove: function() {

		},

		play: function() {
			this.tracksView.play();
		}

	});


	Adapt.once("app:dataReady", function() {
		Adapt.heroBackground = new HeroBackground({
			el: $("body"),
			model: Adapt.course
		});
	}) 


	$(document).one("touchend", function() {
		Adapt.heroBackground.play();
	});

});
