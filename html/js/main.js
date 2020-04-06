htmlInformation = {}

window.onload = initializeJSONData()

async function initializeJSONData() {

	await fetch("html/json/htmlInformation.json").then((response) => {
		return response.json();
	}).then((data) => {
		htmlInformation = data
	});
}

function searchThroughText(needle, haystack, caseSensitive) {
	haystackProper = haystack;
	if (!caseSensitive) {
		haystack = haystack.toLowerCase();
		needle = needle.toLowerCase();
	}
	if (haystack.search(needle) == -1) {
		return
	}
	var indexes = []
	var pos = 0;
	var i = -1;
	while (pos != -1) {
		pos = haystack.indexOf(needle, i + 1);
		if (pos != -1) indexes.push(pos)
		i = pos;
	}
	textOutput = []

	indexes.forEach((el) => {
		startIndex = el;
		endIndex = (el + needle.length);
		lowerCaseStack = haystack.toLowerCase();

		c = lowerCaseStack.substring(startIndex, el);

		while (startIndex > (el - 150) && c.indexOf("\n") == -1 && c.indexOf(">") == -1 && c.indexOf(" *") == -1 && c.indexOf(".") == -1 && c.indexOf(',') == -1 && c.indexOf("!") == -1) {
			c = lowerCaseStack.substring(startIndex, el);
			startIndex -= 1;
		}
		startIndex += 2;

		c = lowerCaseStack.substring(el, endIndex);

		while (endIndex < (el + 150) && c.indexOf("\n") == -1 && c.indexOf("<") == -1 && c.indexOf(" *") == -1 && c.indexOf(".") == -1 && c.indexOf(', and') == -1 && c.indexOf("!") == -1) {
			c = lowerCaseStack.substring(el, endIndex);
			endIndex += 1;
		}
		endIndex -= 2;

		textValue = haystackProper.substring(startIndex, endIndex);
		if (textValue.indexOf(":") == -1) {
			textOutput.push(textValue);
		}
	});

	return textOutput
}

function searchThroughInformation(needle, info, caseSensitive) {
	neededPosts = []
	for (const [key, value] of Object.entries(info)) {
		output = searchThroughText(needle, value, caseSensitive)
		if (typeof output != "undefined" && output != null && output.length != null && output.length > 0) {
			neededPosts.push({
				key: key,
				value: output
			});
		}
	}

	return neededPosts;
}

function changeSearch() {
	needle = document.getElementById("searchInput").value

	if (needle == '')
		return;

	document.body.style.cursor = "wait";
	results = searchThroughInformation(needle, htmlInformation, document.getElementById('caseSensitive').checked);

	resultDiv = document.getElementById('resultsDiv')
	originalDiv = document.getElementById('linksContainer')

	resultsDiv.textContent = ''
	originalDiv.textContent = ''

	bShowNearbyText = document.getElementById('showResults').checked
	bShowTotalCount = true;

	results.forEach((el) => {
		githubLink = "https://github.com/FromDarkHell/BL3NotesReader/blob/master/output/" + el["key"] + ".md"
		newsLink = "https://borderlands.com/en-US/news/" + el["key"]

		linkNode = createNewRedirect(githubLink)
		linkNode.classList.add('resultLink')
		linkNode.innerText = getDateFromKey(el["key"], true)

		resultsDiv.appendChild(linkNode)
		resultsDiv.appendChild(document.createElement("br"))

		if (bShowNearbyText) {

			el["value"].forEach((el => {

				listElement = document.createElement('li');
				listElement.classList.add('resultBullet');

				quoteContent = document.createElement('b');
				quoteContent.classList.add('patchQuote');
				quoteContent.innerText = el;

				listElement.appendChild(quoteContent);
				resultsDiv.appendChild(listElement);
			}));

			resultsDiv.appendChild(document.createElement('br'))
		}

		// Add in the original links to all of our news.
		newsLinkNode = createNewRedirect(newsLink)
		newsLinkNode.innerText = getNewsText(el["key"]);


		originalDiv.appendChild(newsLinkNode);
		originalDiv.appendChild(document.createElement("br"));
	})

	if (bShowTotalCount) {
		document.getElementById('resultsHeader').innerText = (`Results (${results.length})`);
	}

	document.body.style.cursor = "default";
}

function createNewRedirect(href) {
	linkNode = document.createElement("a");
	linkNode.setAttribute('href', href);
	linkNode.setAttribute('target', "_blank");
	linkNode.setAttribute('rel', "noopener noreferrer");
	return linkNode

}

function getNewsText(keyName) {
	date = getDateFromKey(keyName, false);

	title = keyName.substring(11, keyName.substring(0, keyName.lastIndexOf('-')).lastIndexOf('-'));
	title = (title.replace(/-/g, " ").replace("patch hotfixes", "patch and hotfixes") + ": " + date).toTitleCase()

	return title;
}

function getDateFromKey(keyDate, excludeYear) {
	lastDash = keyDate.lastIndexOf('-')
	if (lastDash == -1) {
		return keyDate;
	}

	lastDash += 1

	day = keyDate.substring(lastDash, keyDate.length);
	day = day + (day % 10 == 1 && day != 11 ? 'st' : (day % 10 == 2 && day != 12 ? 'nd' : day % 10 == 3 && day != 13 ? 'rd' : 'th'));

	year = keyDate.substring(0, 4);

	month = keyDate.substring(keyDate.substring(0, lastDash - 1).lastIndexOf('-') + 1, lastDash - 1);
	if (month == 'jan') month = 'January'
	if (month == 'mar') month = 'March'
	if (month == 'may') month = 'May'
	if (month == 'jul') month = 'July'
	if (month == 'sept' || month == 'sep') month = 'September'
	if (month == 'nov') month = 'November'
	if (month == 'feb') month = 'February'
	if (month == 'apr') month = 'April'
	if (month == 'jun') month = 'June'
	if (month == 'aug') month = 'August'
	if (month == 'oct') month = 'October'
	if (month == 'dec') month = 'December'
	constructedDate = (month + " " + day);

	if (!excludeYear || (new Date().getYear() != year)) {
		constructedDate += " " + year;
	}
	return constructedDate
}


/* To Title Case © 2018 David Gouch | https://github.com/gouch/to-title-case */
String.prototype.toTitleCase = function() {
	'use strict'
	var smallWords = /^(a|an|and|as|at|but|by|en|for|if|in|nor|of|on|or|per|the|to|v.?|vs.?|via)$/i
	var alphanumericPattern = /([A-Za-z0-9\u00C0-\u00FF])/
	var wordSeparators = /([ :–—-])/

	return this.split(wordSeparators)
		.map(function(current, index, array) {
			if (
				/* Check for small words */
				current.search(smallWords) > -1 &&
				/* Skip first and last word */
				index !== 0 &&
				index !== array.length - 1 &&
				/* Ignore title end and subtitle start */
				array[index - 3] !== ':' &&
				array[index + 1] !== ':' &&
				/* Ignore small words that start a hyphenated phrase */
				(array[index + 1] !== '-' ||
					(array[index - 1] === '-' && array[index + 1] === '-'))
			) {
				return current.toLowerCase()
			}

			/* Ignore intentional capitalization */
			if (current.substr(1).search(/[A-Z]|\../) > -1) {
				return current
			}

			/* Ignore URLs */
			if (array[index + 1] === ':' && array[index + 2] !== '') {
				return current
			}

			/* Capitalize the first letter */
			return current.replace(alphanumericPattern, function(match) {
				return match.toUpperCase()
			})
		})
		.join('')
}