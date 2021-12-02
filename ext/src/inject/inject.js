let basePath = '';
let repoName = getRepo(document.URL);
const safeRepoName = repoName.replaceAll('/', '_').replaceAll(':', '_').replaceAll('.', '_');

chrome.storage.local.get(safeRepoName, function (result) {
	basePath = result[safeRepoName];
});

chrome.extension.sendMessage({}, function (response) {
	var readyStateCheckInterval = setInterval(function () {
		if (document.readyState === "complete") {



			document.addEventListener('DOMNodeInserted', nodeInsertedCallback);
			const sidebarGroups = document.querySelectorAll('.aui-sidebar-group');
			const lastGroup = sidebarGroups[sidebarGroups.length - 1];
			const configSetBasePath = document.createElement('div');
			configSetBasePath.innerHTML = `<div class="aui-sidebar-group aui-sidebar-group-tier-one sidebar-settings-group"><div class="aui-nav-heading"></div><ul class="aui-nav" resolved=""><li class=" aui-sidebar-settings-button"><a href="#" class="aui-nav-item ">🦄<span class="aui-nav-item-label">Reset jumPR base path for local repo</span></a></li></ul></div>`;
			configSetBasePath.onclick = onLinkClick;
			lastGroup.after(configSetBasePath);
			clearInterval(readyStateCheckInterval);

			// ----------------------------------------------------------
			// This part of the script triggers when page is done loading
			console.log("Hello. This message was sent from scripts/inject.js");
			// ----------------------------------------------------------

		}
	}, 10);
});

function getRepo(uri) {
	const regex = /(?<repo>^https.+)\/pull-requests/gm;
	const matches = regex.exec(uri);
	return matches.groups.repo;
}

function nodeInsertedCallback(event) {
	document.removeEventListener('DOMNodeInserted', nodeInsertedCallback)
	console.log("Listing all the breadcrumbs...");
	// handle links
	const fileBreadcrumbs = document.querySelectorAll('a.file-breadcrumbs-segment-highlighted');
	for (let index = 0; index < fileBreadcrumbs.length; index++) {
		const element = fileBreadcrumbs[index];
		const filePath = `/${element.hash.slice(1, element.hash.indexOf('?') + 1)}`;

		const existingLink = document.querySelector(`[data-linkFor='${element.href}']`);
		if (!existingLink) {
			const openInVsCodeNode = document.createElement('a');
			openInVsCodeNode.setAttribute('data-linkFor', element.href)
			openInVsCodeNode.href = `vscode://file/${basePath}${filePath}`;
			openInVsCodeNode.textContent = 'open in vscode';
			openInVsCodeNode.style = 'margin-left: 10px;';
			element.after(openInVsCodeNode);
			console.log(filePath);
		}

	}
	const spanFileBreadcrumbs = document.querySelectorAll('span.file-breadcrumbs-segment-highlighted');
	for (let index = 0; index < spanFileBreadcrumbs.length; index++) {
		const element = spanFileBreadcrumbs[index];
		const baseUri = new URL(element.baseURI);
		const filePath = `/${baseUri.hash.slice(1)}`;

		const existingLink = document.querySelector(`[data-linkFor='${baseUri}']`);
		if (!existingLink) {
			const openInVsCodeNode = document.createElement('a');
			openInVsCodeNode.setAttribute('data-linkFor', baseUri)
			if (!basePath || basePath == '') {
				openInVsCodeNode.addEventListener('click', onLinkClick, false);
			}
			openInVsCodeNode.href = `vscode://file/${basePath}${filePath}`;

			openInVsCodeNode.textContent = 'open in vscode';
			openInVsCodeNode.style = 'margin-left: 10px;';
			element.after(openInVsCodeNode);
		}

		console.log(filePath);

	}
	console.log("...Listing over.");
	document.addEventListener('DOMNodeInserted', nodeInsertedCallback);

};

function onLinkClick(e) {
	e.preventDefault();
	const basePathCandidate = prompt(`enter local base path for repo:\r\n${repoName}`, basePath);
	if (!!basePathCandidate) {
		const repoConfig = {};
		repoConfig[safeRepoName] = basePathCandidate;
		chrome.storage.local.set(repoConfig, function () {
			const existingLinks = document.querySelectorAll(`[data-linkFor]`);
			document.removeEventListener('DOMNodeInserted', nodeInsertedCallback)
			for (let index = 0; index < existingLinks.length; index++) {
				const link = existingLinks[index];
				link.parentNode.removeChild(link);
			}
			document.addEventListener('DOMNodeInserted', nodeInsertedCallback);
			basePath = basePathCandidate;
			nodeInsertedCallback();
		});
	}
}