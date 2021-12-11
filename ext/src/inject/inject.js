const regexRepo = /(?<repo>^https.+)\/pull-requests/gm;
const regexLine = /#(?<file>[^?]+)(\?t=)*(?<line>[\d]+)*/gm
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
		}
	}, 10);
});

function getRepo(uri) {
	const matches = regexRepo.exec(uri);
	return matches.groups.repo;
}

function parseFileAndLine(uri) {
	regexLine.lastIndex = 0;
	const matches = regexLine.exec(uri);
	return { file: matches.groups.file, line: matches.groups.line || 0 };
}

function nodeInsertedCallback(event) {
	document.removeEventListener('DOMNodeInserted', nodeInsertedCallback)
	patchBranchLozenges();

	// handle links
	const fileBreadcrumbs = document.querySelectorAll('a.file-breadcrumbs-segment-highlighted');
	for (let index = 0; index < fileBreadcrumbs.length; index++) {
		const element = fileBreadcrumbs[index];

		const existingLink = document.querySelector(`[data-linkFor='${element.href}']`);
		if (!existingLink) {
			const fileAndLine = parseFileAndLine(element.href);
			const openInVsCodeNode = document.createElement('a');
			openInVsCodeNode.setAttribute('data-linkFor', element.href)
			openInVsCodeNode.href = `vscode://file/${basePath}${fileAndLine.file}:${fileAndLine.line}:0`;
			openInVsCodeNode.textContent = 'open in vscode';
			openInVsCodeNode.style = 'margin-left: 10px;';
			element.after(openInVsCodeNode);
		}

	}
	const spanFileBreadcrumbs = document.querySelectorAll('span.file-breadcrumbs-segment-highlighted');
	for (let index = 0; index < spanFileBreadcrumbs.length; index++) {
		const element = spanFileBreadcrumbs[index];
		const baseUri = new URL(element.baseURI);

		const existingLinks = document.querySelectorAll(`[data-linkFor]`);
		if (existingLinks.length > 0) {
			existingLinks.forEach(link => {
				link.parentNode.removeChild(link)
			});
		}

		const fileAndLine = parseFileAndLine(baseUri.hash);
		const openInVsCodeNode = document.createElement('a');
		openInVsCodeNode.setAttribute('data-linkFor', baseUri)
		if (!basePath || basePath == '') {
			openInVsCodeNode.addEventListener('click', onLinkClick, false);
		}
		openInVsCodeNode.href = `vscode://file/${basePath}/${fileAndLine.file}:${fileAndLine.line}:0`;

		openInVsCodeNode.textContent = 'open in vscode';
		openInVsCodeNode.style = 'margin-left: 10px;';
		element.after(openInVsCodeNode);
	
	}

	document.addEventListener('DOMNodeInserted', nodeInsertedCallback);

};

function patchBranchLozenges() {
	const branchLozengeContents = document.querySelectorAll('span.ref-lozenge-content');
	for (let index = 0; index < branchLozengeContents.length; index++) {
		const lozengeContent = branchLozengeContents[index];
		patchBranchLozenge(lozengeContent);
		
	}
}

function patchBranchLozenge(branchLozengeContent) {
	const branchSpan = branchLozengeContent.querySelector('span');
	if (branchSpan !== null) {
		// if not already patched
		const branchName = branchSpan.textContent;
		const branchLink = document.createElement('a');
		branchLink.href = `git-uri://checkout/${branchName}?localRepo=${basePath}`;
		branchLink.textContent = branchName;
		branchLozengeContent.removeChild(branchSpan);
		branchLozengeContent.appendChild(branchLink);
	}
}

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