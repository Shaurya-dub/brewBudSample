import { update } from 'firebase/database';
import bodymovin from 'bodymovin';
import Lottie from 'lottie-web';
import {
  initializeApp,
  getDatabase,
  authInit,
  ref,
  remove,
  onValue,
} from './firebase.js';
import { calcRoute, autoCompleteInput, googleUrlGenerator } from './maps.js';

const form = document.querySelector('form');
const roadTripBtn = document.querySelector('.roadTripBtn');
const clearListBtn = document.querySelector('.clearListBtn');
const mapHolder = document.querySelector('.mapHolder');
const breweryListCloseBtn = document.querySelector('.breweryListCloseBtn');
const roadTripList = document.querySelector('.roadTripList');
const startAndEndFormHolder = document.querySelector('.startAndEndFormHolder');
const startAndEndForm = document.querySelector('.startAndEndForm');
const startingPoint = document.querySelector('#startingPoint');
const endingPoint = document.querySelector('#endingPoint');
const ul = document.querySelector('.breweryList');
const savedBreweries = document.querySelector('.savedBreweries');
const roadTripButtons = document.querySelector('.roadTripButtons');
let userUID;
let db;
let setofBreweries = {};
let brewDirectionArray = [];
let breweryAddressAndNameArr = [];

const removeBreweryFromDatabase = async (e) => {
  if (e) {
    const brewName = e.target.attributes[1].value;
    const postListRef = ref(db, `${userUID}/setofBreweries/${brewName}`);
    await remove(postListRef).catch((e) => {
      errorHandlingFunction(e);
    });
    addedBreweryChecker(brewName, addBreweryToList);
  }
};

const initSnapshot = async () => {
  const fireBaseCall = await fetch('/.netlify/functions/fetch-firebase');
  const firebaseData = await fireBaseCall.json();
  const fireBaseApp = initializeApp(firebaseData);
  db = getDatabase(fireBaseApp);
  userUID = await authInit();
  await autoCompleteInput(startingPoint, endingPoint);
  await onValue(ref(db, userUID), (snapshot) => {
    setofBreweries = {};
    brewDirectionArray = [];
    breweryAddressAndNameArr = [];
    const data = snapshot.val();
    savedBreweries.innerHTML = '';

    if (data) {
      for (let brewery in data.setofBreweries) {
        setofBreweries[brewery] = data.setofBreweries[brewery];
        const breweryName = data.setofBreweries[brewery].Name;
        const brewId = data.setofBreweries[brewery].id;
        const breweryAddress = data.setofBreweries[brewery].Address;
        const savedBreweryCard = makeRemovableListEl(
          breweryName,
          'savedBrewCard',
          removeBreweryFromDatabase,
          'remove brewery from list',
          'data-reference',
          brewId
        );

        breweryAddressAndNameArr.push(data.setofBreweries[brewery].Name);

        savedBreweries.append(savedBreweryCard);
        let directionObj = {
          location: breweryAddress,
          stopover: true,
        };

        brewDirectionArray.push(directionObj);
        if (
          document.querySelector(
            `[data-brewery="${data.setofBreweries[brewery].id}"]`
          )
        ) {
          addedBreweryChecker(
            data.setofBreweries[brewery].id,
            addBreweryToList
          );
        }
      }
      roadTripList.style.display = 'initial';
    } else {
      roadTripList.style.display = 'none';

      document.querySelectorAll('.listButton').forEach((btn) => {
        addedBreweryChecker(null, addBreweryToList, false, btn);
      });
    }
  });
};

initSnapshot().catch((e) => {
  errorHandlingFunction(e);
});

// Check for values from API call returned null
const nullChecker = (val, term) => {
  if (!val) {
    return `${term} is unavailable`;
  } else {
    return `${val}`;
  }
};

// Disable "add" button for breweries already in database
const addedBreweryChecker = (
  breweryId,
  eventHandler,
  inDisplayFunc,
  passedBtn
) => {
  let addButton =
    passedBtn || document.querySelector(`[data-brewery="${breweryId}"]`);
  if (setofBreweries[breweryId]?.Name) {
    if (addButton) {
      if (addButton.innerHTML === '+') {
        addButton.innerHTML = ``;
        Lottie.loadAnimation({
          container: addButton, // the dom element that will contain the animation
          renderer: 'svg',
          loop: false,
          autoplay: true,
          path: './media/cheers.json', // the path to the animation json
        });
        addButton.style.paddingBottom = '20px';
        addButton.disabled = 'true';
        addButton.setAttribute('aria-disabled', 'true');
        addButton.setAttribute('aria-label', 'added to list');
        addButton.removeEventListener('click', eventHandler);
      }
      // const addedGif = new Image();
      // addedGif.src = './media/cheers.gif';
      // addedGif.setAttribute('alt', 'brewery added');
      // const animation = bodymovin.loadAnimation({
      //   container: addButton,
      //   path: '../media/cheers.json', // Required
      //   renderer: 'html', // Required
      //   loop: false, // Optional
      //   autoplay: true, // Optional
      //   name: 'Hello World', // Name for future reference. Optional.
      // });
      // addButton.appendChild(addedGif);
      // Lottie.loadAnimation({
      //   container: addButton, // the dom element that will contain the animation
      //   renderer: 'svg',
      //   loop: false,
      //   autoplay: true,
      //   path: './media/cheers.json', // the path to the animation json
      // });
      // addButton.disabled = 'true';
      // addButton.setAttribute('aria-disabled', 'true');
      // addButton.setAttribute('aria-label', 'added to list');
      // addButton.removeEventListener('click', eventHandler);

      if (inDisplayFunc) {
        addButton.setAttribute('data-brewery', breweryId);
        Lottie.loadAnimation({
          container: addButton, // the dom element that will contain the animation
          renderer: 'svg',
          loop: false,
          autoplay: true,
          path: './media/cheers.json', // the path to the animation json
        });
        addButton.disabled = 'true';
        addButton.setAttribute('aria-disabled', 'true');
        addButton.setAttribute('aria-label', 'added to list');
        return addButton;
      }
    }
  } else {
    if (addButton) {
      addButton.innerHTML = '+';
      addButton.disabled = false;
      addButton.removeAttribute('aria-disabled');
      addButton.setAttribute('aria-label', 'add to list');
      addButton.addEventListener('click', eventHandler);
      if (inDisplayFunc) {
        addButton.setAttribute('data-brewery', breweryId);
        return addButton;
      }
    }
  }
};

const errorHandlingFunction = (e) => {
  const errorScreen = document.querySelector('.errorScreen');
  const errorMessage = document.querySelector('.errorMessage');
  errorScreen.classList.remove('errorScreenHide');
  errorScreen.focus();
  errorMessage.innerHTML = e?.message || null;
  const closeBtn = document.querySelector('.closeBtn');
  closeBtn.addEventListener(
    'click',
    function () {
      errorScreen.classList.add('errorScreenHide');
    },
    { once: true }
  );
};

// Make API call to get brewery list based on location
const getCity = (selectInput, userInput) => {
  document.querySelector('.loadingScreen').style.display = 'block';
  const url = new URL(
    `https://api.openbrewerydb.org/breweries?${selectInput}=${userInput}`
  );

  fetch(url)
    .then(function (res) {
      return res.json();
    })
    .then(function (brewery) {
      if (brewery.length < 1) {
        throw new Error();
      }
      brewery.forEach((result) => {
        const breweryType = result.brewery_type;
        if (breweryType !== 'closed' && breweryType !== 'planning') {
          displayFunction(result);
        }
      });
      document.querySelector('.loadingScreen').style.display = 'none';
    })
    .catch((err) => {
      errorHandlingFunction(err);
      document.querySelector('.loadingScreen').style.display = 'none';
    });
};

// append result from API to the page
const displayFunction = (str) => {
  const li = document.createElement('li');
  const buttonLinkHolder = document.createElement('div');
  buttonLinkHolder.classList.add('buttonLinkHolder');
  li.setAttribute('tabindex', 0);
  li.classList.add('breweryCard');
  setTimeout((e) => {
    li.classList.add('fade');
  }, 50);
  const name = str.name.replace(/[^a-zA-Z0-9 ]/g, '');
  const street = nullChecker(str.street, 'Street address');
  const city = nullChecker(str.city, 'City info');
  const state = nullChecker(str.state, 'State info');
  const postalCode = nullChecker(str.postal_code, 'Postal Code');
  const phone = nullChecker(str.phone, 'Phone Number');
  // const site = nullChecker(str.website_url, "Website");
  const site = str.website_url
    ? `<a target="_blank" href="${str.website_url}">${str.website_url}</a>`
    : `<p>Website unavailable</p>`;
  buttonLinkHolder.innerHTML = site;
  let newBtn = document.createElement('button');
  const addBreweryBtn = addedBreweryChecker(
    str.id,
    addBreweryToList,
    true,
    newBtn
  );
  addBreweryBtn.classList.add('listButton');
  buttonLinkHolder.appendChild(addBreweryBtn);

  li.innerHTML = `<h2>${name}</h2> <p>${street}, ${city} ${postalCode}, ${state}</p> <p class="phone"> ${phone}</p>`;
  li.appendChild(buttonLinkHolder);
  ul.appendChild(li);
};

const makeRemovableListEl = (
  listContent,
  listClass,
  listRemoveFunc,
  ariaLabel,
  listAttributeName,
  listAttributeValue
) => {
  let removableListEl = document.createElement('li');
  removableListEl.innerHTML = `<h3 class="${listClass}">${listContent}</h3>`;
  let removeButton = document.createElement('button');
  removeButton.innerText = 'X';
  removeButton.setAttribute('aria-label', ariaLabel);
  if (listAttributeName) {
    removeButton.setAttribute(listAttributeName, listAttributeValue);
  }
  removeButton.addEventListener('click', listRemoveFunc);

  removableListEl.prepend(removeButton);
  return removableListEl;
};

const addBreweryToList = function (e) {
  if (breweryAddressAndNameArr.length >= 10) {
    window.alert('You can only add 10 breweries per trip');
    return;
  }
  const brewCard = [...e.target.parentNode.parentNode.childNodes];

  const buttonAttribute = this.getAttribute('data-brewery');
  const newArr = brewCard
    .map((info) => {
      return info.innerText;
    })
    .filter((el) => el && el !== '+');
  newArr.push(buttonAttribute);
  const objId = buttonAttribute;

  const postListRef = ref(db, `${userUID}/setofBreweries/${objId}`);
  update(postListRef, {
    Name: newArr[0],
    Address: newArr[1],
    Phone: newArr[2],
    Website: newArr[3],
    id: newArr[4],
  });
};

// Function to turn zip code into lat/long coordinates
//Originally, brewery API would only return breweries AT a zip code (as opposed to near a zip code)
// Using Geocoding bypasses this issue
const geoCodeUrl = (zip) => {
  fetch(`/.netlify/functions/fetch-coordinates?postal_code=${zip}`)
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      const coordinates = data.results[0].location;
      const { lat, lng } = coordinates;
      const latAndLng = `${lat.toFixed(4)},${lng.toFixed(4)}`;
      getCity('by_dist', latAndLng);
    })
    .catch((err) => {
      errorHandlingFunction(err);
    });
};

form.addEventListener('submit', function (e) {
  e.preventDefault();
  const selectValue = document.querySelector('select').value;
  const inputValue = document.querySelector('input[type="text"]').value;
  ul.innerHTML = '';
  if (selectValue === 'by_postal') {
    geoCodeUrl(inputValue);
  } else {
    getCity(selectValue, inputValue);
  }
});

roadTripBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  startAndEndFormHolder.classList.remove('startAndEndFormHolderHide');
  startAndEndFormHolder.addEventListener('keydown', trapFocus);
  startingPoint.focus();
  roadTripButtons.setAttribute('aria-hidden', true);
  savedBreweries.setAttribute('aria-hidden', true);
  const cancelTripBtn = document.querySelector('.cancelTripBtn');
  cancelTripBtn.addEventListener('click', (e) => {
    e.stopPropagation();

    startAndEndFormHolder.removeEventListener('keydown', trapFocus);
    startAndEndFormHolder.classList.add('startAndEndFormHolderHide');
    savedBreweries.removeAttribute('aria-hidden');
    roadTripButtons.removeAttribute('aria-hidden');
  });
});

clearListBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  let postListRef = ref(db, userUID);
  await remove(postListRef).catch((e) => {
    errorHandlingFunction(e);
  });
});

startAndEndForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const startingPointVal = startingPoint.value;
  const endingPointVal = endingPoint.value;
  const calcRouteResult = await calcRoute(
    brewDirectionArray,
    startingPointVal,
    endingPointVal,
    breweryAddressAndNameArr
  ).catch((e) => {
    errorHandlingFunction(e);
  });

  const link = googleUrlGenerator(
    calcRouteResult,
    breweryAddressAndNameArr,
    startingPointVal,
    endingPointVal
  );
  const mapDirectionsLink = document.querySelector('.mapDirectionsLink');
  mapDirectionsLink.innerHTML = `<a class="mapDirectionsLink" target="_blank" href="${link}">Click here to open your directions link</a>`;
  const copyLinkBtn = document.querySelector('.copyLinkBtn');
  const copyConfirmationContainer = document.querySelector(
    '.confirmTextContainer'
  );
  const copyConfirmationMessage = document.querySelector('.confirmText');
  const copyLink = async () => {
    await copyToClipboard(
      link,
      copyConfirmationContainer,
      copyConfirmationMessage,
      'Link Copied'
    );
  };
  copyLinkBtn.addEventListener('click', copyLink);

  mapHolder.classList.add('showMap');
  const mapContentHolder = document.querySelector('.mapContentHolder');
  mapContentHolder.addEventListener('keydown', trapFocus);
  startAndEndForm.reset();
  startAndEndFormHolder.classList.add('startAndEndFormHolderHide');
  const mapCloseBtn = document.querySelector('.mapCloseBtn');
  mapCloseBtn.addEventListener(
    'click',
    () => {
      mapContentHolder.removeEventListener('keydown', trapFocus);
      copyLinkBtn.removeEventListener('click', copyLink);
      mapHolder.classList.remove('showMap');
      savedBreweries.removeAttribute('aria-hidden');
      roadTripButtons.removeAttribute('aria-hidden');
    },
    { once: true }
  );
  mapCloseBtn.focus();
});

breweryListCloseBtn.addEventListener('click', function (e) {
  const collapsibleModalHolder = document.querySelector(
    '.collapsibleModalHolder'
  );
  this.setAttribute(
    'aria-expanded',
    `${!(this.getAttribute('aria-expanded') === 'true')}`
  );
  collapsibleModalHolder.setAttribute(
    'aria-hidden',
    `${!(collapsibleModalHolder.getAttribute('aria-hidden') === 'true')}`
  );
  roadTripList.classList.toggle('roadTripHide');
  this.getAttribute('aria-expanded') === 'true'
    ? roadTripList.addEventListener('keydown', trapFocus)
    : roadTripList.removeEventListener('keydown', trapFocus);
});

const copyToClipboard = async (
  textToCopy,
  confirmationParent,
  confirmationChild,
  confirmationMessage
) => {
  try {
    await navigator.clipboard.writeText(textToCopy);

    confirmationParent.style.display = 'block';
    confirmationChild.innerText = confirmationMessage;
    setTimeout(() => {
      confirmationParent.style.display = 'none';
    }, 2000);
  } catch (error) {
    alert(`Failed to copy text to clipboard: ${error.message}`);
  }
};

function trapFocus(e) {
  e.stopPropagation();
  var focusableEls = this.querySelectorAll(
    'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled]), li'
  );
  var firstFocusableEl = focusableEls[0];
  var lastFocusableEl = focusableEls[focusableEls.length - 1];
  var KEYCODE_TAB = 9;

  var isTabPressed = e.key === 'Tab' || e.keyCode === KEYCODE_TAB;

  if (!isTabPressed) {
    return;
  }

  if (e.shiftKey) {
    /* shift + tab */ if (document.activeElement === firstFocusableEl) {
      lastFocusableEl.focus();
      e.preventDefault();
    }
  } /* tab */ else {
    if (document.activeElement === lastFocusableEl) {
      firstFocusableEl.focus();
      e.preventDefault();
    }
  }
}
