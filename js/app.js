var map;
var infowindow;

var startingPos = new google.maps.LatLng(-36.8618, 174.7621);

// initial arrays used as a default state
var initialTypes = [
	'art_gallery', 'book_store', 'museum', 'movie_theater', 'stadium', 'university', 'police'
];
var initialMarkers = [];
var initialMarkerNames = [];

// actual arrays used for displaying on the map
var markers = ko.observableArray();
var markerNames = ko.observableArray();
var types = ko.observableArray(initialTypes);

// search element html, done this way to accomodate for more complicated logic
var searchElem = '<div class="pac-item"><a href="#"><span class="pac-icon %icon%"></span><span class="pac-item-query"><span class="pac-matched">%name%</span></span><span></span></a></div>'

var service;

// default and current results for the list view
var initialSearchResultsArray = [];
var searchResultsArray = ko.observableArray();

// function for displaying suggestions for the search bar, bound to input's change event
function searchResults(e) {
	var text = e.target.value.toLowerCase();
	var it;
	var el;
	var container = $('#pac-container');
	// function to add element to the suggestions
	var add = function(icon, cb) {
		el = $(searchElem.replace('%name%', it).replace('%icon%', icon));
		container.append(el);
		el.on('click', cb);
		container.css('display', 'block');
	}
	// reset container's data
	container.html('');
	container.css('display', 'none');
	// if the search string is empty, reset to initial state
	if (text == '') {
		reset();
		return;
	}
	// add types matching search string to the suggestions
	for (idx in initialTypes) {
		it = initialTypes[idx];
		if (it.toLowerCase().indexOf(text) > -1) {
			add('pac-icon-search', filterResultsType);
		}
	}
	// add names matching search string to the suggestions
	for (idx in initialMarkerNames) {
		it = initialMarkerNames[idx];
		if (it.toLowerCase().indexOf(text) > -1) {
			add('pac-icon-marker', filterResultsPlace);
		}
	}	
}

// reset application to the initial state
function reset() {
	markers(initialMarkers);
	markerNames(initialMarkerNames);
	setAllMarkers(map);
	map.setCenter(startingPos);
	infowindow.close();
	types(initialTypes);
	searchResultsArray(initialSearchResultsArray);
}

// set all markers to be either visible or invisible
// - map - map object on which markers should be visible, 
//         if set to null, all markers will be rendered invisible
function setAllMarkers(map) {
	var marker;
	for (var idx in markers()) {
		marker = markers()[idx];
		marker.setMap(map);
	}
}

// filter markers and list view based on the type
function filterResultsType(e) {
	//types([e.target.textContent]);
	var marker;
	reset();
	for (var idx in markers()) {
		marker = markers()[idx];
		if (marker.types.indexOf(e.target.textContent) == -1)
			marker.setMap(null);
	}
	searchResultsArray(ko.utils.arrayFilter(initialSearchResultsArray, function(el) {
    return el.type == e.target.textContent;
  }));
	//getPlaces(map);
  $(e.target).closest('#pac-container').css('display', 'none');
	document.getElementById('pac-input').value = e.target.textContent;
}

// filter markers and list view based on the name
function filterResultsPlace(e) {
	var name = e.target.textContent;
	var idx = markerNames.indexOf(name);
	var marker = markers()[idx];
	var latLng = marker.getPosition();
	reset();
	map.setCenter(latLng);
  setInfowindow(marker.title, marker);
	searchResultsArray(ko.utils.arrayFilter(initialSearchResultsArray, function(el) {
    return el.name == e.target.textContent;
  }));
  $(e.target).closest('#pac-container').css('display', 'none');
	document.getElementById('pac-input').value = e.target.textContent;
}

// when the list view element was clicked, center on the related marker and show it's infowindow
function listElementClicked() {
	var marker;
	for (var idx in markers()) {
		if (markers()[idx].title == this) {
			marker = markers()[idx];
			break;
		}
	}
	if (marker) {
		var latLng = marker.getPosition();
		map.setCenter(latLng);
		setInfowindow(marker.title, marker);
	}
}

// set infowindow's data for a given marker and open it
// - name - name to be displayed
// - marker - marker for which infowindow should be displayed
function setInfowindow(name, marker) {
  var position = marker.getPosition();
  // picture for infowindow is being pulled from street view api
  infowindow.setContent('<p><b>' + name + '</b></p><img src="https://maps.googleapis.com/maps/api/streetview?size=150x150&location=' + position.lat() + ',' + position.lng() + '&key=AIzaSyAQQKdRYZeSSDMm9Lrh98wDAmGEzQ8mB8U">');
  position.D = marker.posD;
  infowindow.setPosition(position);
  infowindow.open(map, marker);
  google.maps.event.addListener(infowindow,'closeclick',function(){
  	searchResultsArray(initialSearchResultsArray);
  	map.setCenter(startingPos);
  	document.getElementById('pac-input').value = '';
	});
}

// create a marker for a given place
function createMarker(place) {
  var placeLoc = place.geometry.location;
  // set up icon image
  var image = {
    url: place.icon,
    size: new google.maps.Size(71, 71),
    scaledSize: new google.maps.Size(25, 25),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(17, 34)
  };
  // create marker
  var marker = new google.maps.Marker({
    map: map,
    position: placeLoc,
    title: place.name,
    icon: image,
    posD: placeLoc.D - 0.0005,
    types: place.types
  });
  // push to appropriate arrays
  markers.push(marker);
  initialMarkers.push(marker);
  markerNames.push(place.name);
  initialMarkerNames.push(place.name);

  // on click event listener for marker
  google.maps.event.addListener(marker, 'click', function() {
		var latLng = this.getPosition();
		map.setCenter(latLng);
		searchResultsArray(ko.utils.arrayFilter(initialSearchResultsArray, function(el) {
	    return el.name == place.name;
	  }));
  	setInfowindow(place.name, this);
  });
}

// process results from google places. if no results, populate list view data based on
// marker's data
function processDetails(results, status) {
	var getEl = function(r) {
		return {
			name: r.name,
			address: r.formatted_address,
			phone: r.international_phone_number,
			icon: r.icon,
			url: r.url,
			reviews: r.reviews,
			type: r.types[0]
		}
	}
	var el;
	if (status == google.maps.places.PlacesServiceStatus.OK) {
		el = getEl(results);
	} else {
		el = getEl(this);
	}
	initialSearchResultsArray.push(el);
	initialSearchResultsArray.sort(function(left, right) { return left.address && right.address ? 0 : (left.address ? -1 : 1) })
	searchResultsArray(initialSearchResultsArray);
}

// process results from the call to google places for nearby search
function processPlaces(results, status) {
	setAllMarkers(null);
	markers([]);
  if (status == google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < results.length; i++) {
      createMarker(results[i]);
      // request details from google places
			service.getDetails({placeId: results[i].place_id}, processDetails.bind(results[i]));
    }
  }
}

// get all places in a certain radius from a starting position with given types
function getPlaces(map) {
	var request = {
		location: startingPos,
		radius: 500,
		types: types()
	}
	service = new google.maps.places.PlacesService(map);
	service.nearbySearch(request, processPlaces);
	searchResultsArray([]);
}

// initialize map and application
function initialize() {
  var mapOptions = {
    center: { lat: -36.8618, lng: 174.7621},
    zoom: 16
  };

  map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
  infowindow = new google.maps.InfoWindow();

  getPlaces(map);
	$('#pac-input').on('input', searchResults);
	ko.applyBindings(searchResultsArray);
}

google.maps.event.addDomListener(window, 'load', initialize);