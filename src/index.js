import axios from '../node_modules/axios';

// form fields
const form = document.querySelector('.form-data');
const region = document.querySelector('.region-name');
const apiKey = document.querySelector('.api-key');

// results
const errors = document.querySelector('.errors');
const loading = document.querySelector('.loading');
const results = document.querySelector('.result-container');
const usage = document.querySelector('.carbon-usage');
const fossilfuel = document.querySelector('.fossil-fuel');
const myregion = document.querySelector('.my-region');
const clearBtn = document.querySelector('.clear-btn');

const calculateColor = async (value) => {

	const table = new Map([
		[0, 'green'],
		[150, 'yellow'],
		[600, 'indianred'],
		[750, 'red'],
		[800, 'black'],
	]);

	const closestKey = [...table.keys()].reduce((acc, key) => {
		return acc = (Math.abs(acc - value) < Math.abs(key - value)) ? acc : key
	})

	let closestColor = table.get(closestKey);
	console.log(closestColor);
	chrome.runtime.sendMessage({ action: 'updateIcon', value: { color: closestColor } });
};

const displayCarbonUsage = async (apiKey, region) => {
	try {
		await axios
			.get('https://api.co2signal.com/v1/latest', {
				params: {
					countryCode: region,
				},
				headers: {
					//please get your own token from CO2Signal https://www.co2signal.com/
					'auth-token': apiKey,
				},
			})


			.then((response) => {
				let CO2 = Math.floor(response.data.data.carbonIntensity);

				calculateColor(CO2);
				loading.classList.add("hide");
				form.classList.add("hide");

				myregion.textContent = region;
				usage.textContent =
					Math.round(response.data.data.carbonIntensity) + ' grams (grams C02 emitted per kilowatt hour)';
				fossilfuel.textContent =
					response.data.data.fossilFuelPercentage.toFixed(2) +
					'% (percentage of fossil fuels used to generate electricity)';

				results.classList.remove("hide")
			});
	} catch (error) {
		console.log(error);
		loading.classList.add("hide");
		results.classList.add("hide")
		errors.textContent = 'Sorry, we have no data for the region you have requested.';
	}
};

// set up api key and region
const setUpUser = async (apiKey, regionName) => {
	localStorage.setItem('apiKey', apiKey);
	localStorage.setItem('regionName', regionName);

	loading.classList.remove("hide");
	errors.textContent = '';
	clearBtn.classList.remove("hide");

	//make initial call
	displayCarbonUsage(apiKey, regionName);
};

// handle form submission
const handleSubmit = async (e) => {
	e.preventDefault();
	setUpUser(apiKey.value, region.value);
};

//initial checks
const init = async () => {
	//if anything is in localStorage, pick it up
	const storedApiKey = localStorage.getItem('apiKey');
	const storedRegion = localStorage.getItem('regionName');

	//set icon to be generic green
	chrome.runtime.sendMessage({
		action: 'updateIcon',
		value: {
			color: 'green',
		},
	});

	if (storedApiKey === null || storedRegion === null) {
		form.classList.remove("hide");
		results.classList.add('hide');
		loading.classList.add('hide');
		clearBtn.classList.add('hide');

		errors.textContent = '';
	} else {
		//if we have saved keys/regions in localStorage, show results when they load
		results.classList.add("hide");

		form.classList.add("hide");

		displayCarbonUsage(storedApiKey, storedRegion);

		clearBtn.classList.remove('hide')
	}
};

const reset = async (e) => {
	e.preventDefault();
	//clear local storage for region only
	localStorage.removeItem('regionName');
	init();
};

form.addEventListener('submit', (e) => handleSubmit(e));
clearBtn.addEventListener('click', (e) => reset(e));

//start app
init();
