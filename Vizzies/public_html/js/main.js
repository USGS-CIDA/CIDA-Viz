var map;
$(document).ready(function () {

	var getDroughtStyle = function (feature) {
		var dm = feature.values_.DM,
			fillColors = {
				0: 'rgba(255, 255, 0, 0.5)',
				1: 'rgba(255, 211, 127, 0.5)',
				2: 'rgba(230, 152, 0, 0.5)',
				3: 'rgba(230, 0, 0, 0.5)',
				4: 'rgba(115, 0, 0, 0.5)'
			};
		return [new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: fillColors[dm],
					width: 1
				}),
				fill: new ol.style.Fill({
					color: fillColors[dm]
				})
			})];
	};
	var getFireStyle = function () {
		return [new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: 'red',
					width: 2
				}),
				fill: new ol.style.Fill({
					color: 'red'
				}),
				image: new ol.style.Circle({
					radius: 10,
					fill: null,
					stroke: new ol.style.Stroke({
						color: 'red'
					})
				})
			})];
	};
	var getFireLayer = function (timestep) {
		if (timestep) {
			var layer = new ol.layer.Vector({
				source: new ol.source.GeoJSON({
					url: 'data/fire_shp/FIRE_' + timestep + '.json',
					projection: ol.proj.get('EPSG:3857')
				}),
				style: getFireStyle,
				visible: true,
				opacity: 1
			});
			layer.layer_type = 'fire';
			return layer;
		}
		
	};
	
	var getInitialDroughtLayer = function () {
		return getDroughtLayer('20140916_US');
	};
	
	var getDroughtLayer = function (timestep) {
		if (timestep) {
			var layer = new ol.layer.Vector({
				source: new ol.source.GeoJSON({
					url: 'data/drought_shp/USDM_' + timestep + '.json',
					projection: ol.proj.get('EPSG:3857')
				}),
				style: getDroughtStyle,
				visible: true,
				opacity: 1
			});
			layer.layer_type = 'drought';
			return layer;
		}
	};
	
	var continentalView = new ol.View({
		center: ol.proj.transform([-98.5, 39.5], "EPSG:4326", "EPSG:3857"),
		zoom: 4
	});
	
	var californiaView = new ol.View({
		center : [-13319610.800861657, 4501835.217883743],
		zoom: 5
	});
	
	map = new ol.Map({
		layers: [
			new ol.layer.Tile({
				source: new ol.source.OSM()
			})
		],
		target: 'map',
		controls: [new ol.control.MousePosition()],
		view: continentalView,
		renderer: 'canvas'
	});
	var panAndZoom = function (newView) {
		var duration = 1500;
		var start = +new Date();
		var pan = ol.animation.pan({
			duration: duration,
			source: /** @type {ol.Coordinate} */ (map.getView().getCenter()),
			start: start
		});
		var zoom = ol.animation.zoom({
			duration: duration,
			resolution: map.getView().getResolution(),
			start: start
		});
		map.beforeRender(pan, zoom);
		map.setView(newView);
	};

	var controller = new ScrollMagic();
	// build scenes
	new ScrollScene({triggerElement: "#startTrigger", duration: $(window).height()})
		.on("enter", function(e) {
			$("#time-indicator").text("");
			panAndZoom(continentalView);
			map.replaceLayer(getInitialDroughtLayer(), 'drought');
		})
		.addTo(controller)
		.addIndicators();
	// Scene 1 built in response to ajax
	new ScrollScene({triggerElement: "#trigger2", duration: 2000})
		.setPin("#feature2")
		.addTo(controller)
		.addIndicators();
	new ScrollScene({triggerElement: "#trigger3", duration: 2000})
		.setPin("#feature3")
		.addTo(controller)
		.addIndicators();
	new ScrollScene({triggerElement: "#trigger4", duration: 2000})
		.setPin("#feature4")
		.addTo(controller)
		.addIndicators();
	new ScrollScene({triggerElement: "#trigger5", duration: 2000})
		.setPin("#feature5")
		.addTo(controller)
		.addIndicators();	
	
	map.replaceLayer = function (layer, layerType) {
		map.addLayer(layer);
		layer.getSource().on('change', function (event) {
			var isReady = event.target.state_ === 'ready';
			if (isReady) {
				var layers = map.getLayers().array_.filter(function (oldLayer) {
					return oldLayer.layer_type === layerType && oldLayer !== layer;
				});
				for (var i = 0; i < layers.length; i++) {
					map.removeLayer(layers[i]);
				}
			}
		});
	};
	
	var updateTimestep = function (timestep) {
		var droughtLayer = getDroughtLayer(timestep);
		var fireLayer = getFireLayer(timestep);
		var datestr = Date.create(timestep).format("{d} {Month} {yyyy}");
		map.replaceLayer(droughtLayer, 'drought');
		map.replaceLayer(fireLayer, 'fire');
		$('#time-indicator').text(datestr);
	};
	var sitesLayer = new ol.layer.Vector({
		source: new ol.source.GeoJSON({
			url: 'data/reservoirs/ca_reservoirs.geojson',
			projection: ol.proj.get('EPSG:3857')
		}),
		style: [new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: 'blue',
					width: 2
				}),
				fill: new ol.style.Fill({
					color: 'blue'
				}),
				image: new ol.style.Circle({
					radius: 1,
					fill: null,
					stroke: new ol.style.Stroke({
						color: 'blue'
					})
				})
			})],
		visible: true,
		opacity: 1
	});
	map.addLayer(sitesLayer);

	var lastIndexCalled = 0;
	$.ajax('data/drought_shp/times.json', {
		success: function (data) {
			var timesArray = data.d.reverse();
			new ScrollScene({triggerElement: "#trigger1", duration: 40000})
				.setPin("#feature1")
				.setTween(TweenMax.fromTo("#time-indicator", 1, {x: 0}, {x: $(window).width() - 400}))
				.on("progress", function (e) {
					var index = Math.floor(timesArray.length * e.progress);
					if(index != lastIndexCalled) {
						updateTimestep(timesArray[index]);
						lastIndexCalled = index;
					}
				})
				.on("enter", function (e) {
					panAndZoom(californiaView);
				})
				.addTo(controller)
				.addIndicators();
		}
	});
	

	$('.links-anchor').on('click', function(e) {
		var $target = $(e.target),
			filledClass = 'links-anchor-link-filled',
			emptyClass = 'links-anchor-link-empty';
		
		if ($(e.target).hasClass('links-anchor-link-filled')) {
			e.stopImmediatePropagation();
			return false;
		} else {
			$('.' + filledClass).switchClass(filledClass, emptyClass, 250, 'linear', function() {});
			$(e.target).switchClass(emptyClass, filledClass, 250, 'linear', function() {});
		}
	});
	
	new ScrollControl({
		scrollRate: 50,
		scrollStep: 25, 
		parent: $(document.body)
	});
});
