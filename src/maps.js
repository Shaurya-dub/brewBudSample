import { Loader } from "@googlemaps/js-api-loader";

async function autoCompleteInput(...inputs) {
  const mapsCall = await fetch("/.netlify/functions/fetch-maps");
  const mapsData = await mapsCall.json();
  const loader = new Loader({
    apiKey: mapsData,
    version: "weekly",
    libraries: ["places", "maps"],
  });
  await loader.load().catch((e) => console.error("loading error", e));
  inputs.map((input) => {
    const autoComplete = new google.maps.places.Autocomplete(input);
    autoComplete.addListener("place_changed", () => {
      const place = autoComplete.getPlace();
      if (!place.geometry || !place.geometry.location) {
        window.alert("No details available for input: '" + place.name + "'");
        return;
      }
    });
  });
}

function markerMaker(lat, lng, map, markerTitle, label) {
  const latLng = { lat: lat, lng: lng };
  const marker = new google.maps.Marker({
    position: latLng,
    map,
    title: markerTitle,
    label: label,
    optimized: false,
  });
  const infoWindow = new google.maps.InfoWindow({
    content: markerTitle,
    ariaLabel: markerTitle,
  });
  marker.addListener("click", function () {
    infoWindow.open({
      anchor: marker,
      map,
    });
  });
  return marker;
}
async function calcRoute(
  brewDirectionArray,
  startingPoint,
  endingPoint,
  breweryAddressAndNameArr
) {
  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer({
    suppressMarkers: true,
  });

  var map = new google.maps.Map(document.getElementById("map"));
  directionsRenderer.setMap(map);

  const res = await directionsService.route({
    origin: startingPoint,
    destination: endingPoint,
    waypoints: brewDirectionArray,
    optimizeWaypoints: true,
    travelMode: "DRIVING",
  });

  directionsRenderer.setDirections(res);
  const routeCords = res.routes[0].legs;
  const waypointOrder = res.routes[0].waypoint_order;
  const labelLetters = "BCDEFGHIJKLMNOPQRSTUVWXYZ";
  let markers = [];
  for (let i = 0; i < routeCords.length; i++) {
    if (i === 0) {
      let markerLabel = startingPoint === endingPoint ? "" : "A";
      const startLat = routeCords[i].start_location.lat();
      const startLng = routeCords[i].start_location.lng();
      const marker = markerMaker(
        startLat,
        startLng,
        map,
        startingPoint,
        markerLabel
      );
      markers.push(marker);
    }
    let markerTitle;
    let markerLabel = labelLetters[i];
    if (i === routeCords.length - 1) {
      markerTitle = endingPoint;
      if (startingPoint === endingPoint) {
        markerLabel = `A/${labelLetters[i]}`;
      }
    } else {
      markerTitle = breweryAddressAndNameArr[waypointOrder[i]];
    }

    const lat = routeCords[i].end_location.lat();
    const lng = routeCords[i].end_location.lng();
    const marker = markerMaker(lat, lng, map, markerTitle, markerLabel);
    markers.push(marker);
  }
  return res;
}
const googleUrlGenerator = (res, waypointAddressArr, startPoint, endPoint) => {
  let geoCodedArr = res.geocoded_waypoints;
  const startId = geoCodedArr.pop().place_id;
  const endId = geoCodedArr.shift().place_id;
  let googleUrl = "https://www.google.com/maps/dir/?api=1&";
  googleUrl +=
    "origin=" + encodeURIComponent(startPoint) + "&origin_place_id=" + startId;
  googleUrl +=
    "&destination=" +
    encodeURIComponent(endPoint) +
    "&destination_place_id=" +
    endId;
  let addressHolderArr = [];
  let placeIdHolderArr = [];
  let waypointOrderArr = res.routes[0].waypoint_order;

  for (let i = 0; i < waypointOrderArr.length; i++) {
    const waypointOrderIndex = waypointOrderArr[i];
    addressHolderArr.push(waypointAddressArr[waypointOrderIndex]);
    placeIdHolderArr.push(geoCodedArr[i].place_id);
  }
  const placeIds = placeIdHolderArr.join("|");
  const wayPointAddresses = encodeURIComponent(addressHolderArr.join("|"));

  googleUrl += `&waypoints=${wayPointAddresses}&waypoint_place_ids=${placeIds}`;
  return googleUrl;
};
export { calcRoute, autoCompleteInput, googleUrlGenerator };
