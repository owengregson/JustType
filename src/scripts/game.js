window.enabled = false;
let currentWordIndex = 0;
let currentCharIndex = 0;
let typingTimeout; // To track typing inactivity
let wordAmount = 25;
let startTime;
let latestTypeTime;
let wordsCompleted = 0;
let oldWordsCompleted = 0;
let wpm = 1;
let combo = 0;
let charsTyped = [];
let finishedWordTimestamp;
let beginWordTimestamp;
let timeToCompleteThisWord = 0;
let wpmPerWord = [];
let charsWithTimestamps = [];
let firstInteraction = false;
let fireLoopFI = false;
let WPMstarter;
let comboTimeoutBegin;
let comboTimeoutLoop;
let comboTimeoutStop;
const defaultSettings = {
	testSettings: {
		puncAndNum: {
			punctuationMode: false,
			numbersMode: false,
		},
		mode: {
			time: false,
			words: true,
			quote: false,
			zen: false,
			custom: false,
		},
		time: {
			15: false,
			30: true,
			60: false,
			120: false,
			custom: false,
		},
		wordCount: {
			10: false,
			25: true,
			50: false,
			100: false,
			custom: false,
		},
		quoteLength: {
			"-1": false,
			0: false,
			1: false,
			2: false,
			3: false,
			"-3": false,
			"-2": false,
		},
	},
	theme: "serika-dark",
	wordKind: "english_default",
};
function randomRange(min, max) {
	// get a random float (if there is decimals in the min/max) or a random int (if there is no decimals) within the min and max
	return Math.random() * (max - min) + min;
}
const PrintTypes = {
	SUCCESS: {
		background: "#4CAF50",
		color: "#000",
	},
	INFO: {
		background: "#69CDFF",
		color: "#000",
	},
	WARNING: {
		background: "#FFCD38",
		color: "#000",
	},
	ERROR: {
		background: "#F44336",
		color: "#000",
	},
};
window.auto = false;
window.loadText = "Loading page...";
window.loadProgress = 0;
function print(printType, text) {
	const debug = true;
	if (debug)
		console.log(
			"%c" +
				Object.keys(PrintTypes).find(
					(key) => PrintTypes[key] === printType
				),
			"background: " +
				printType.background +
				";color: " +
				printType.color +
				";padding:0 5px;border-radius:10px",
			text
		);
}
/*var console = {};
console.log = function (text) {
	print(PrintTypes.INFO, text);
};
window.console = console;*/
function initGame() {
	window.loadText = "Initializing...";
	window.loadProgress += 10;
	loadSettings();
	setTheme(window.settings.theme);
	// get the words from the file at ./words/(window.settings.wordKind).json["words"]
	async function getWords() {
		const response = await fetch(
			`./words/${
				window.settings.wordKind ? window.settings.wordKind : "english"
			}.json`
		);
		const data = await response.json();
		return data.words;
	}

	getWords().then((wData) => {
		window.wordsList = wData;
		window.wordsList = window.wordsList.filter((word) => word.length >= 2);
		window.wordsList.forEach(function (part, index, theArray) {
			theArray[index] = theArray[index] + " ";
		});

		document.querySelector(".loader").style.opacity = 0;
		document
			.querySelector(".loader")
			.addEventListener("transitionend", function () {
				document.querySelector(".loader").style.display = "none";
				document.querySelector(".loadStageTwo").style.display =
					"inline-block";
				setTimeout(() => {
					document.querySelector(".loadStageTwo").style.display =
						"flex";
					document.querySelector(".loadStageTwo").style.opacity = 1;
				}, 75);
			});
		window.loaderChange = setInterval(() => {
			document.querySelector(".loadText").innerText = window.loadText;
			// set .loaderBar:after width to window.loadProgress%
			if (window.loadProgress > 100) window.loadProgress = 100;
			document.querySelector(".loaderBarFill").style.width =
				window.loadProgress + "%";
			if (window.loadProgress == 100) {
				document
					.querySelector(".loaderBarFill")
					.addEventListener("transitionend", function () {
						setTimeout(() => {
							hideLoader();
						}, 75);
					});
			}
		}, 10);
		print(PrintTypes.INFO, "Initializing game...");
		window.loadText = "Initializing configuration...";
		window.loadProgress += 10;
		document.querySelectorAll(".svg-icon").forEach(async function (elem) {
			const svgSrc = elem.getAttribute("data-svg-src");
			const response = await fetch(svgSrc);
			const svgText = await response.text();
			elem.innerHTML = svgText;
		});
		print(PrintTypes.INFO, "Adding event listeners...");
		window.loadText = "Adding event listeners...";
		window.loadProgress += 10;
		document.querySelectorAll(".textButton").forEach(async function (tb) {
			// on click, remove class active from other options and add .actidfveghjkl;hfdsdfghjk to this one
			tb.addEventListener("click", function () {
				// dynamically check all textButtons in the same parent
				let parent = tb.parentElement;
				let textButtons = parent.querySelectorAll(".textButton");
				let foundMode = false;
				textButtons.forEach(function (tb) {
					// if all of the class names doesn't contain mode
					let classesArray = Array.from(tb.classList);
					for (let i = 0; i < classesArray.length; i++) {
						if (classesArray[i].toLowerCase().includes("mode")) {
							foundMode = true;
							break;
						}
					}
					if (!foundMode) tb.classList.remove("active");
				});
				// if you are clicking the same one and foundMode is true, remove active
				if (tb.classList.contains("active") && foundMode) {
					tb.classList.remove("active");
				} else {
					tb.classList.add("active");
				}
				print(PrintTypes.INFO, "Settings Updated");
				changeSettings();
				newTest();
			});
			print(
				PrintTypes.SUCCESS,
				"Added EventListener to textButton " + tb.innerText.trim()
			);
		});
		print(PrintTypes.SUCCESS, "Successfully added event listeners!");

		window.loadText = "Configuring Statistics...";
		window.loadProgress += 10;
		print(PrintTypes.INFO, "Initializing StatisticsBar...");

		// Adjust the statistics in the statistics bar to be right above the words div
		const sessionProgress = document.getElementById("sessionProgress");

		let scaleFactor = 1.1;
		window.pulseSizes = {
			wordsPerMinute: {
				min: parseFloat(
					window
						.getComputedStyle(
							document.getElementById("wordsPerMinute"),
							null
						)
						.getPropertyValue("font-size")
				),
				max:
					parseFloat(
						window
							.getComputedStyle(
								document.getElementById("wordsPerMinute"),
								null
							)
							.getPropertyValue("font-size")
					) * scaleFactor,
			},
			wordsCompleted: {
				min: parseFloat(
					window
						.getComputedStyle(
							document.getElementById("wordsCompleted"),
							null
						)
						.getPropertyValue("font-size")
				),
				max:
					parseFloat(
						window
							.getComputedStyle(
								document.getElementById("wordsCompleted"),
								null
							)
							.getPropertyValue("font-size")
					) * scaleFactor,
			},
			combo: {
				min: parseFloat(
					window
						.getComputedStyle(
							document.getElementById("combo"),
							null
						)
						.getPropertyValue("font-size")
				),
				max:
					parseFloat(
						window
							.getComputedStyle(
								document.getElementById("combo"),
								null
							)
							.getPropertyValue("font-size")
					) * scaleFactor,
			},
		};

		// propegate the themePicker
		addThemes();

		print(PrintTypes.SUCCESS, "StatisticsBar Initialized!");

		window.loadText = "Initializing Game Elements...";
		window.loadProgress += 20;

		// Position caret initially without flashing
		print(PrintTypes.INFO, "Initializing Game Elements...");
		const caret = document.getElementById("caret");
		caret.style.animation = "none";
		caret.style.display = "block";
		window.comboMusicOn = false;
		window.combo_loop = new Audio(`./sounds/combo_mode_loop_1.wav`);
		setInterval(() => {
			let wpmElement = document.getElementById("wordsPerMinute");
			let fireElement = document.querySelector(".fire");
			fireElement.style.left =
				wpmElement.offsetLeft +
				20 +
				wpmElement.offsetWidth / 2 -
				fireElement.offsetWidth / 2 +
				"px";
			fireElement.style.top =
				wpmElement.offsetTop +
				10 +
				wpmElement.offsetHeight / 2 -
				fireElement.offsetHeight / 2 +
				"px";
		}, 75);
		caret.style.opacity = 1;
		caret.style.animation = "caretFlashSmooth 1s infinite";
		print(PrintTypes.SUCCESS, "Game Elements Initialized!");
		window.loadText = "Generating New Test...";
		window.loadProgress += 30;
		newTest();
		window.loadText = "Cleaning up...";
		window.loadProgress += 5;
		print(
			PrintTypes.SUCCESS,
			"\n\n====================\n\nGame Initialized!\n\n====================\n\n"
		);
		setTimeout(() => {
			window.loadText = "Starting...";
			window.loadProgress = 100;
		}, 400);
		setInterval(() => {
			periodic();
		}, 75);
	});
	document.addEventListener("keydown", handleKeyPress);
	document.addEventListener("contextmenu", (event) => event.preventDefault());
	document.addEventListener("mousedown", function () {
		playSound("click");
	});
}

function periodic() {
	moveCaret();
}

async function addThemes() {
	let themePicker = document.getElementById("themePicker");
	const response = await fetch("./styles/themes/");
	let text = await response.text();
	text = text
		.substring(text.indexOf("</tr>") + 5)
		.replace(/\n/g, "")
		.replace(/\s/g, "")
		.match(/<ahref=".*?">.*?<\/a>/g);

	text.forEach((element, index) => {
		// extract the href
		let href = element.match(/<ahref="(.*?)">/)[1];
		// extract the innerText
		let innerText = element.match(/<ahref=".*?">(.*?)<\/a>/)[1];
		// add a new option to the themePicker
		let newOption = document.createElement("option");
		newOption.value = href;

		// convert serika_dark -> Serika Dark
		let formattedName = innerText.replace(/_/g, " ");
		// capitalize the first letter of each word
		formattedName = formattedName.replace(/\b\w/g, (l) => l.toUpperCase());
		// replace .Css with nothing
		formattedName = formattedName.replace(".Css", "");
		newOption.innerText = formattedName;
		themePicker.appendChild(newOption);
	});
}

function hideLoader() {
	document.querySelector(".loadStageTwo").style.opacity = 0;
	document.getElementById("loading").style.opacity = 0;
	document.getElementById("loading").style.pointerEvents = "none";
	// wait until transition finishes dynamically
	document
		.getElementById("loading")
		.addEventListener("transitionend", function () {
			clearInterval(window.loaderChange);
			document.getElementById("loading").style.display = "none";
			window.enabled = true;
		});
}

function loadSettings() {
	print(PrintTypes.INFO, "Loading settings...");
	window.settings = {};
	let shouldReset = false;
	// attempt to load from localStorage "settings"
	if (localStorage.getItem("settings")) {
		// validate settings structure
		let potentialSettings = "FAIL";
		try {
			potentialSettings = JSON.parse(localStorage.getItem("settings"));
		} catch (e) {}
		if (potentialSettings == "FAIL" || !potentialSettings.testSettings) {
			localStorage.removeItem("settings");
			print(
				PrintTypes.ERROR,
				"Settings were invalid and have been reset."
			);
			shouldReset = true;
		} else {
			print(PrintTypes.SUCCESS, "Loaded settings successfully.");
			window.settings = potentialSettings;
		}
	}
	if (shouldReset) {
		window.settings = defaultSettings;
	}
	pushSettings();

	let testConfig = document.getElementById("testConfig");
	// iterate over the settings object and apply the active class to the appropriate elements
	for (let category in window.settings.testSettings) {
		// find the respective category in the testConfig
		let categoryElement = testConfig.querySelector(`.${category}`);
		for (let i = 0; i < categoryElement.children.length; i++) {
			console.log(categoryElement);
			let child = categoryElement.children[i];
			let childText = child.innerText.trim();
			if (childText == "") return;
			for (let setting in window.settings.testSettings[category]) {
				if (childText == setting) {
					if (window.settings.testSettings[category][setting]) {
						console.log(
							`Setting ${setting} in category ${category} to active`
						);
						child.classList.add("active");
					} else {
						child.classList.remove("active");
					}
				}
			}
		}
	}
}

function pushSettings() {
	// push settings to local storage
	localStorage.setItem("settings", JSON.stringify(window.settings));
	print(PrintTypes.SUCCESS, "Pushed settings to LocalStorage");
}

function changeSettings() {
	// reset the current settings
	for (let property in window.settings) window.settings.property = {};

	/* Theme Settings */
	//window.settings.theme = "/styles/themes/serika_dark.css";//document.getElementById('themePicker').value;

	/* Words Settings */
	window.settings.wordKind = "english";
	/* Test Settings */
	// Directly iterate over the child elements of the first child of 'testConfig'.
	let currentCategoryName = "";
	Array.from(
		document.getElementById("testConfig").children[0].children
	).forEach((element) => {
		if (element.classList.contains("spacer")) {
			// On encountering a spacer, reset currentCategoryName to prepare for the next category.
			currentCategoryName = "";
		} else {
			// Determine the category name from the classList of the first relevant element encountered.
			if (!currentCategoryName) {
				currentCategoryName = element.classList[0];
				window.settings.testSettings[currentCategoryName] = {};
			}
			// Iterate over children of the current setting element to populate the settings object.
			Array.from(element.children).forEach((child) => {
				let settingName = child.innerText.trim();
				if (settingName) {
					window.settings.testSettings[currentCategoryName][
						settingName
					] = child.classList.contains("active");
				}
			});
		}
	});
	pushSettings();
}

function newTest(withSettings = window.settings.testSettings) {
	print(PrintTypes.INFO, "Generating new test...");
	const wordsContainer = document.getElementById("wordsContainer");
	// fade out the statistics
	const sessionProgress = document.getElementById("sessionProgress");
	if (wordsContainer.children.length > 0) {
		sessionProgress.style.animation = "fadeOut 0.2s";
		sessionProgress.addEventListener("animationend", function () {
			sessionProgress.style.animation = "fadeIn 0.2s";
			sessionProgress.addEventListener("animationend", function () {
				sessionProgress.style.animation = "none";
			});
		});
	}
	// clear all stats from this session
	wordsCompleted = 0;
	oldWordsCompleted = 0;
	if (wpm > 1) {
		clearTimeout(WPMstarter);
		window.fire_loop.volume = 0;
		document.querySelector(".fire").style.opacity = 0;
		wpm = 1;
		document.getElementById("wordsPerMinute").innerText = `0 wpm`;
	}
	wpm = 1;
	if (combo > 0) {
		document.getElementById("combo").textContent = `Combo: 0x`;
		window.combo_loop.pause();
		window.combo_loop.currentTime = 0;
		combo = 0;
		clearTimeout(comboTimeoutBegin);
		clearTimeout(comboTimeoutLoop);
		clearTimeout(comboTimeoutStop);
		for (let i = 0; i < 20; i++) {
			setTimeout(() => {
				window.comboMusicOn = false;
				window.combo_loop.volume = 0;
				window.combo_loop.pause();
				window.combo_loop.currentTime = 0;
				window.comboMusic.volume = 0;
			}, i * 10);
		}
	}
	combo = 0;
	charsTyped = [];
	firstInteraction = false;
	finishedWordTimestamp = 0;
	beginWordTimestamp = 0;
	timeToCompleteThisWord = 0;
	wpmPerWord = [];
	charsWithTimestamps = [];
	// clear all variables
	currentWordIndex = 0;
	currentCharIndex = 0;
	typingTimeout = null;
	startTime = null;
	latestTypeTime = null;
	let calledAWFix = false;
	// if the wordsContainer has children, add the fadeOut animation, then remove fadeOut animation, then remove all children, add the new words, then add the fadeIn animation, then remove the fadeIn animation
	if (wordsContainer.children.length > 0) {
		wordsContainer.style.animation = "fadeOut 0.2s";
		// dynamically wait until the fadeOut animation is done by waiting through event listener
		wordsContainer.addEventListener("animationend", function () {
			if (calledAWFix) return;
			calledAWFix = true;
			wordsContainer.style.animation = "none";
			addWords(withSettings);
			wordsContainer.style.animation = "fadeIn 0.2s";
			wordsContainer.addEventListener("animationend", function () {
				wordsContainer.style.animation = "none";
			});
		});
	} else {
		addWords(withSettings);
	}

	// update caret and statistics
	moveCaret();
	if (wordsContainer.getAnimations().length > 0) {
		wordsContainer.addEventListener("animationend", function () {
			updateStatistics(true);
		});
	} else {
		updateStatistics(true);
	}
}

function addWords(withSettings = window.settings.testSettings) {
	wordsContainer.innerHTML = "";
	let currentMode = getSettingsPreference("mode");
	if (currentMode == "words") {
		let wordsToAdd = 0;
		wordsToAdd = parseInt(getSettingsPreference("wordCount"));
		for (let i = 0; i < wordsToAdd; i++) {
			const wordSpan = document.createElement("word");
			wordSpan.dataset.index = i;
			wordSpan.innerHTML = window.wordsList[
				Math.round(randomRange(0, window.wordsList.length - 1))
			]
				.split("")
				.map(
					(char, index) =>
						`<letter class="transition" data-char-index="${index}">${char}</letter>`
				)
				.join("");
			wordsContainer.appendChild(wordSpan);
		}
	} else if (currentMode == "time") {
		// add 10 words when the user finishes until the timer runs out
		let time = parseInt(getSettingsPreference("time"));
		let wordsToAdd = 10;
		for (let i = 0; i < wordsToAdd; i++) {
			const wordSpan = document.createElement("word");
			wordSpan.dataset.index = i;
			wordSpan.innerHTML = window.wordsList[
				randomRange(0, window.wordsList.length - 1)
			]
				.split("")
				.map(
					(char, index) =>
						`<letter class="transition" data-char-index="${index}">${char}</letter>`
				)
				.join("");
			wordsContainer.appendChild(wordSpan);
		}
	}
	// remove the last space from the last word
	wordsContainer.lastChild.children[
		wordsContainer.lastChild.children.length - 1
	].remove();
	print(PrintTypes.SUCCESS, "Words Regenerated");
}

function changeTheme() {
	let themePicker = document.getElementById("themePicker");
	let theme = themePicker.value;
	setTheme(theme);
	pushSettings();
}

async function updateFavicon() {
	const response = await fetch("./images/logo.svg");
	const data = await response.text();
	const parser = new DOMParser();
	const svg = parser.parseFromString(data, "image/svg+xml");
	const path = svg.querySelector("#text");
	const color = window
		.getComputedStyle(document.documentElement)
		.getPropertyValue("--main-color");
	path.setAttribute("fill", color);
	const background = svg.querySelector("#background");
	const bgColor = window
		.getComputedStyle(document.documentElement)
		.getPropertyValue("--bg-color");
	background.setAttribute("fill", bgColor);
	const serializer = new XMLSerializer();
	const svgString = serializer.serializeToString(svg);
	document.querySelectorAll('link[rel="icon"]').forEach((elem) => {
		elem.remove();
	});
	const favicon = document.createElement("link");
	favicon.rel = "icon";
	favicon.type = "image/svg+xml";
	favicon.href = "data:image/svg+xml," + encodeURIComponent(svgString);
	document.head.appendChild(favicon);
}

function setTheme(themeKind = "/styles/themes/serika_dark.css") {
	if (
		!window.settings.theme ||
		(window.settings.theme != themeKind && window.settings.theme)
	) {
		window.settings.theme = themeKind;
	}
	//let themeLink = document.getElementById("theme");
	//if (themeLink) themeLink.remove();
	let link = document.createElement("link");
	link.id = "theme";
	link.classList.add("newTheme");
	link.rel = "stylesheet";
	link.href = window.settings.theme;
	document.getElementById("themePicker").value = window.settings.theme;
	document.head.appendChild(link);
	updateFavicon();
	setTimeout(() => {
		link.classList.remove("newTheme");
		/*let themeLink = document.getElementById('theme');
            if(!themeLink.classList.contains("newTheme")) themeLink.remove();*/
		print(PrintTypes.SUCCESS, "Theme Changed to " + window.settings.theme);
	}, 15);
}

function createBanner(text, colorKind = "good", isClosable = true) {
	if (window.bannerExists) return;
	window.bannerExists = true;
	let banner = document.createElement("div");
	banner.classList.add("banner", colorKind);
	let container = document.createElement("div");
	container.classList.add("container");
	let textElement = document.createElement("div");
	textElement.classList.add("text", "center");
	textElement.innerText = text;
	container.appendChild(textElement);
	const bannerCenter = document.getElementById("bannerCenter");

	if (isClosable) {
		let closeButton = document.createElement("i");
		closeButton.classList.add("fas", "fa-fw", "fa-times");
		closeButton.addEventListener("click", function () {
			bannerCenter.style.top = `-${banner.offsetHeight}px`; // Move banner out of view
			adjustContentWrapperPadding(0);
			bannerCenter.addEventListener("transitionend", function () {
				try {
					bannerCenter.removeChild(banner);
					window.bannerExists = false;
				} catch (e) {}
			});
		});
		container.appendChild(closeButton);
	}

	banner.appendChild(container);
	bannerCenter.appendChild(banner);

	// Initially, move the banner out of view
	bannerCenter.style.top = `-${banner.offsetHeight}px`;

	// Function to dynamically adjust content wrapper padding
	function adjustContentWrapperPadding(additionalHeight) {
		let contentWrapper = document.getElementById("contentWrapper");
		contentWrapper.style.transition =
			"padding-top 0.2s ease-out, min-height 0.2s ease-out";
		// adjust the --pTop CSS variable in contentWrapper to add the additional height
		let currentPadding = parseFloat(
			window.getComputedStyle(contentWrapper).getPropertyValue("--pTop")
		);
		// adjust the --pTop variable of the contentWrapper, make sure it is in rem
		if (additionalHeight != 0) {
			contentWrapper.style.setProperty(
				"--pTop",
				`${currentPadding + additionalHeight / 16}rem`
			);
		} else {
			// remove the css variable
			contentWrapper.style.removeProperty("--pTop");
		}
	}

	// Animate banner appearance
	setTimeout(() => {
		playSound("notification");
		bannerCenter.style.transition = "top 0.2s ease-out";
		bannerCenter.style.top = "0px"; // Move banner into view
		adjustContentWrapperPadding(banner.offsetHeight);
	}, 3); // Delay to ensure the initial top position is applied
}

// Additional styles needed:
// Ensure #bannerCenter has position: fixed and is initially placed out of view using top property in CSS.
// Adjust #contentWrapper padding-top dynamically in JavaScript as shown above.

function getSettingsPreference(key) {
	for (let category in window.settings.testSettings[key])
		if (window.settings.testSettings[key][category]) return category;
}
function getChars() {
	const words = document.querySelectorAll("word");
	return Array.from(words).reduce((acc, word) => {
		const chars = word.querySelectorAll("letter");
		return acc.concat(Array.from(chars).map((char) => char.textContent));
	}, []);
}

function typeWords() {
	if (window.auto) return;
	window.auto = true;
	const timePerKey = 43;
	const chars = getChars();
	for (let i = 0; i < chars.length; i++) {
		setTimeout(() => {
			handleKeyPress({ key: chars[i] });
		}, i * timePerKey);
	}
	setTimeout(() => {
		window.auto = false;
	}, chars.length * timePerKey);
}

function beginFireLoop() {
	window.fire_loop = new Audio(`./sounds/on_fire_1.wav`);
	window.fire_loop.volume = 0;
	window.fire_loop.playbackRate = 1;
	window.fire_loop.loop = true;
	window.fire_loop.play();
}

function updateWPM() {
	//const timeElapsed = (Date.now() - startTime) / 1000 / 60; // Minutes
	//wpm = Math.round(wordsCompleted / timeElapsed);
	let timeNext = 1000;
	const wordsPerMinuteSpan = document.getElementById("wordsPerMinute");
	// calculate WPM based on charsWithTimestamps
	let timeElapsed =
		(charsWithTimestamps[charsWithTimestamps.length - 1].timestamp -
			charsWithTimestamps[0].timestamp) /
		1000 /
		60; // Minutes
	wpm = Math.round(charsWithTimestamps.length / 5 / timeElapsed);
	if (combo == 0 && window.comboMusicOn) comboMusic("stop");
	wordsPerMinuteSpan.innerText = `${wpm} wpm`;
	// calculate based on WPM (100 wpm => 200ms)
	timeNext = 19500 / wpm;
	idPulse("wordsPerMinute");
	playSound("wpm_pulse");
	// change fire opacity based on WPM, 130 wpm => 1 opacity
	// 95 wpm = 0 opacity
	if (wpm > 85) {
		let fireOpacity = (wpm - 85) / 35;
		fireOpacity = fireOpacity > 1 ? 1 : fireOpacity;
		window.fire_loop.volume =
			fireOpacity - 0.77 < 0 ? 0 : fireOpacity - 0.77;
		document.querySelector(".fire").style.opacity = fireOpacity;
	} else {
		window.fire_loop.volume = 0;
		document.querySelector(".fire").style.opacity = 0;
	}
	// set the new timeout
	WPMstarter = setTimeout(() => {
		updateWPM();
	}, timeNext);
}

function idPulse(id) {
	const element = document.getElementById(id);
	element.style.animation = "none";
	void element.offsetWidth;
	element.style.animation = "pulse 0.1s ease";
	element.style.animationFillMode = "forwards";
	element.style.transformOrigin = "bottom left";
	let newSize = window.pulseSizes[id]["max"];
	element.style.fontSize = window.pulseSizes[id]["max"] + "px";
	let sizeInterval = setInterval(() => {
		let factor =
			1 -
			(window.pulseSizes[id]["max"] - window.pulseSizes[id]["min"]) / 400;
		newSize = newSize * factor;
		if (newSize <= window.pulseSizes[id]["min"]) {
			clearInterval(sizeInterval);
			element.style.fontSize = window.pulseSizes[id]["min"] + "px";
		} else {
			element.style.fontSize = newSize + "px";
		}
	}, 1);
}

function updateStatistics(justMadeNewTest = false) {
	print(PrintTypes.INFO, "Statistics Update");
	latestTypeTime = Date.now();
	const words = document.querySelectorAll("word");
	const wordsContainer = document.getElementById("wordsContainer");
	const correctChars = Array.from(words).reduce((acc, word) => {
		const chars = word.querySelectorAll("letter");
		const correctChars = Array.from(chars).filter((char) =>
			char.classList.contains("correct")
		);
		return acc + correctChars.length;
	}, 0);
	const totalChars = Array.from(words).reduce((acc, word) => {
		const chars = word.querySelectorAll("letter");
		return acc + chars.length;
	}, 0);
	wordsCompleted = Array.from(words).filter((word) =>
		word.querySelector("letter:last-child").classList.contains("correct")
	).length;
	print(
		PrintTypes.INFO,
		"Words Completed: " +
			wordsCompleted +
			"/" +
			wordsContainer.children.length
	);
	if (justMadeNewTest) {
		wordsCompleted = 0;
		oldWordsCompleted = 0;
	}
	if (wordsCompleted == wordsContainer.children.length) {
		newTest();
	}
	const wordsCompletedSpan = document.getElementById("wordsCompleted");
	wordsCompletedSpan.textContent = `${wordsCompleted}/${wordsContainer.children.length}`;
	if (oldWordsCompleted != wordsCompleted) {
		print(PrintTypes.SUCCESS, "Word Complete!");
		idPulse("wordsCompleted");
		if (!fireLoopFI) {
			beginFireLoop();
			fireLoopFI = true;
		}
		if (!firstInteraction && !justMadeNewTest) {
			updateWPM();
			firstInteraction = true;
		}
	}
	oldWordsCompleted = wordsCompleted;
}

function playSound(kind) {
	print(PrintTypes.INFO, "Playing sound with kind: " + kind);
	let soundPitch = randomRange(0.9, 1.14);
	let soundIndex, volume, audio;
	let playType = 0;
	volume = 1;
	if (kind == "correct") {
		soundIndex = Math.round(randomRange(1, 6));
		playType = 1;
	} else if (kind == "incorrect" || kind == "wpm_pulse") {
		soundIndex = 1;
		if (kind == "wpm_pulse") {
			volume = 0.2; // 0.2
			soundPitch = randomRange(0.97, 1.16);
			playType=1;
		}
		if (kind == "incorrect") volume = 1;
	} else if (kind == "complete_word") {
		soundIndex = Math.round(randomRange(1, 3));
		soundPitch = randomRange(0.88, 1.14);
		volume = 0.5; // 0.7
		playType = 1;
	} else if (kind.includes("combo")) {
		// combo_1 to combo_8
		// replace _(number) with ""
		soundIndex = kind.slice(-1);
		kind = kind.replace(/_\d/g, "");
		soundPitch = 1;
		volume = 0.6;
	} else if (kind == "click") {
		soundIndex = 1;
		soundPitch = randomRange(0.75, 1.1);
		console.log("PITCH: " + soundPitch)
		volume = 0.4;
		playType = 1;
	} else if (kind == "notification") {
		soundIndex = 1;
		soundPitch = 1;
		volume = 0.6;
		playType = 0;
	}
	const url = `./sounds/${kind}_${soundIndex}.wav`;
	if (playType == 0) {
		audio = new Audio(url);
		audio.volume = volume;
		audio.playbackRate = soundPitch;
		audio.play();
	} else if (playType == 1) {
		const sound = new Howl({
			src: [`./sounds/${kind}_${soundIndex}.wav`],
			volume: volume,
			rate: soundPitch, // Controls the playback rate, which affects pitch
		});

		// Play the sound
		sound.play();
	}
}

function comboMusic(state = "start") {
	if (state == "start") {
		window.comboMusicOn = true;
		audio = new Audio(`./sounds/combo_mode_enter_1.wav`);
		audio.volume = 0.4;
		audio.playbackRate = 1;
		audio.play();
		// wait until sound finishes playing then play the loop
		comboTimeoutBegin = setTimeout(() => {
			comboMusic("loop");
		}, 3420);
	} else if (state == "loop") {
		// check if it's already playing
		window.comboMusicOn = true;
		window.combo_loop.currentTime = 0;
		window.combo_loop.volume = 0.4;
		window.combo_loop.playbackRate = 1;
		window.combo_loop.play();
		comboTimeoutLoop = setTimeout(() => {
			if (window.comboMusicOn) {
				comboMusic("loop");
			} //else { comboMusic("stop"); }
		}, 3420);
	} else if (state == "stop") {
		window.comboMusicOn = false;
		window.combo_loop.currentTime = 0;
		for (let i = 0; i < 10; i++) {
			comboTimeoutStop = setTimeout(() => {
				if (window.combo_loop.volume - 0.1 >= 0)
					window.combo_loop.volume -= 0.1;
			}, i * 25);
		}
		window.combo_loop.loop = false;
		audio = new Audio(`./sounds/combo_mode_exit_1.wav`);
		audio.volume = 0.4;
		audio.playbackRate = 1;
		audio.play();
	}
}

function startComboMusic() {
	comboMusic("start");
}
function stopComboMusic() {
	window.comboMusicOn = false;
	comboMusic("stop");
}

function handleKeyPress(e) {
	if (!window.enabled) return;
	let human = false;
	try {
		e.preventDefault();
		human = true;
	} catch (e) {
		human = false;
	}
	if (human && window.auto) return;
	print(PrintTypes.INFO, 'Key Triggered: "' + e.key + '"');
	const words = document.querySelectorAll("word");
	const currentWord = words[currentWordIndex];
	const chars = currentWord.querySelectorAll("letter");
	if (!beginWordTimestamp || beginWordTimestamp == 0) {
		beginWordTimestamp = Date.now();
	}
	charsTyped.push(e.key);
	charsWithTimestamps.push({
		char: e.key,
		timestamp: Date.now(),
	});
	// if it's any of the modifier keys, arrow keys return
	if (
		e.key === "Shift" ||
		e.key === "Control" ||
		e.key === "Alt" ||
		e.key === "Meta" ||
		e.key === "ArrowLeft" ||
		e.key === "ArrowRight" ||
		e.key === "ArrowUp" ||
		e.key === "ArrowDown"
	)
		return;
	if (e.key === "Tab" || e.key === "Escape") {
		newTest();
		return;
	}
	if (e.key === "+") {
		typeWords();
		return;
	}
	if (e.key === "Backspace") {
		if (currentCharIndex > 0) {
			// check if we are deleting an excess char
			if (
				chars[currentCharIndex - 1].classList.contains(
					"incorrect-excess"
				)
			) {
				currentWord.removeChild(chars[currentCharIndex - 1]);
			}
			playSound("correct");
			currentCharIndex--;
			chars[currentCharIndex].classList.remove("correct", "incorrect");
		}
		return;
	}
	if (e.key === chars[currentCharIndex]?.textContent) {
		playSound("correct");
		chars[currentCharIndex].classList.add("correct");
		currentCharIndex++;
		if (
			currentCharIndex >= chars.length &&
			currentWordIndex < words.length - 1
		) {
			if (
				charsTyped.join("").replace(" ", "") ==
				currentWord.textContent.trim()
			) {
				combo++;
				charsTyped = [];
			} else {
				combo = 0;
				charsTyped = [];
			}
			finishedWordTimestamp = Date.now();
			timeToCompleteThisWord = finishedWordTimestamp - beginWordTimestamp;
			wpmPerWord.push(60000 / timeToCompleteThisWord);

			beginWordTimestamp = 0;

			if (timeToCompleteThisWord > 4000) {
				// reset the WPM if the user takes more than 10 seconds to type a word
				startTime = Date.now();
			}
			if (timeToCompleteThisWord > 1000) {
				combo = 0;
			}
			if (combo > 5) {
				idPulse("combo");
				document.getElementById("combo").textContent = `Combo: ${
					combo - 5
				}x`;
				const sound = combo - 5 > 8 ? 8 : combo - 6;
				if (!window.comboMusicOn) startComboMusic();
				playSound("combo_" + sound);
			} else {
				playSound("complete_word");
			}
			// add "completed" class to the word
			currentWord.classList.add("completed");
			currentWordIndex++;
			currentCharIndex = 0;
		}
	} else {
		if (combo != 0) idPulse("combo");
		document.getElementById("combo").textContent = `Combo: 0x`;
		combo = 0;
		playSound("incorrect");
		// check if we're at the end of the word
		if (
			currentCharIndex < chars.length &&
			!(chars[currentCharIndex].textContent === " ")
		) {
			chars[currentCharIndex].classList.add("incorrect");
			currentCharIndex++;
		} /* else {
                let extraIncorrectChar = document.createElement('span');
                extraIncorrectChar.classList.add('char', 'incorrect-excess');
                extraIncorrectChar.textContent = e.key;
                currentWord.appendChild(extraIncorrectChar);
                currentCharIndex++;
            }*/
		// penalize the charWithTimestamps by subtracting from the first timestamp
		charsWithTimestamps[0].timestamp -= 200;
	}
	clearTimeout(typingTimeout); // Clear the timeout on key press
	const caret = document.getElementById("caret");
	caret.style.opacity = 1; // Make caret solid on key press
	caret.style.animation = "none"; // Stop flashing animation

	updateStatistics();
	moveCaret();

	typingTimeout = setTimeout(() => {
		caret.style.opacity = 1;
		caret.style.animation = "caretFlashSmooth 1s infinite";
	}, 1000);
}

function moveCaret() {
	const caret = document.getElementById("caret");
	if (currentWordIndex < document.querySelectorAll("word").length) {
		const currentWord = document.querySelectorAll("word")[currentWordIndex];
		const chars = currentWord.querySelectorAll("letter");
		if (currentCharIndex <= chars.length) {
			const targetChar = chars[currentCharIndex];
			positionCaretAtChar(targetChar);
		} else if (currentCharIndex >= chars.length) {
			// Position the caret at the end of the current word when moving to the next word
			const lastChar = chars[chars.length - 1];
			positionCaretAtChar(lastChar, true);
		}
	}
}

function positionCaretAtChar(char, atEnd = false) {
	const caret = document.getElementById("caret");
	const rect = char.getBoundingClientRect();
	caret.style.top = `${rect.top + window.scrollY + 5}px`; // Adjusted to match caret margin
	if (atEnd) {
		caret.style.left = `${rect.left + rect.width + window.scrollX}px`;
	} else {
		caret.style.left = `${rect.left + window.scrollX}px`; // Adjust for current character
	}
	scrollWordsContainer(char);
	hideNotVisibleLines();
}

function scrollWordsContainer(currentChar) {
	const wordsContainer = document.getElementById("wordsContainer");
	const currentWord = document.querySelectorAll("word")[currentWordIndex];

	if (!currentWord) return; // Exit if currentWord is not found

	// Finding the current word's position and height
	const wordHeight = currentWord.offsetHeight;
	const wordTopPosition = currentWord.offsetTop;

	// Container properties
	const containerHeight = wordsContainer.offsetHeight;

	// Desired position is two lines below the current word's top position
	// Plus some padding to ensure the line is fully visible
	let desiredTopPosition = wordTopPosition + wordHeight * 2 - containerHeight;

	// Scroll to the desired position, adjusting to ensure it's not beyond the container's scrollable content
	let maxScrollTop = wordsContainer.scrollHeight - containerHeight;
	desiredTopPosition = Math.min(desiredTopPosition, maxScrollTop);

	desiredTopPosition += 65;

	wordsContainer.scrollTo({
		top: desiredTopPosition,
		behavior: "smooth",
	});
}

function hideNotVisibleLines() {
	const wordsContainer = document.getElementById("wordsContainer");
	const containerTop = wordsContainer.offsetTop;
	const words = document.querySelectorAll("word");

	words.forEach((word) => {
		const wordTop = word.offsetTop - wordsContainer.scrollTop;
		const isCompleted = word.classList.contains("completed");

		// Check if the word is above the visible area (considering an additional -50px offset)
		const isAboveVisibleArea = wordTop < -10;

		if (isCompleted && isAboveVisibleArea) {
			/*word.style.animation = "fadeOut 0.2s "; // Hide the word
						word.addEventListener("animationend", () => {
							word.style.opacity = "0";
						});*/
		}
	});

	// if there is at least 1 line that has 0 opacity, make the wordsContainerBlur-top visible
	let found = false;
	words.forEach((word) => {
		if (word.style.opacity == "0") {
			found = true;
		}
	});
	if (found) {
		document.getElementById("wordsContainerBlur-top").style.display =
			"block";
	} else {
		document.getElementById("wordsContainerBlur-top").style.opacity =
			"none";
	}
}
