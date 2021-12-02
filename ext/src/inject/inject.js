chrome.extension.sendMessage({}, function (response) {
	var readyStateCheckInterval = setInterval(function () {
		if (document.readyState === "complete") {
			document.addEventListener('DOMNodeInserted', nodeInsertedCallback);

			clearInterval(readyStateCheckInterval);

			// ----------------------------------------------------------
			// This part of the script triggers when page is done loading
			console.log("Hello. This message was sent from scripts/inject.js");
			// ----------------------------------------------------------

		}
	}, 10);
});

function nodeInsertedCallback(event) {
	document.removeEventListener('DOMNodeInserted', nodeInsertedCallback)
	console.log("Listing all the breadcrumbs...");
	// handle links
	const fileBreadcrumbs = document.querySelectorAll('a.file-breadcrumbs-segment-highlighted');
	for (let index = 0; index < fileBreadcrumbs.length; index++) {
		const element = fileBreadcrumbs[index];
		const filePath = `/${element.hash.slice(1, element.hash.indexOf('?')+1)}`;

		const existingLink = document.querySelector(`[data-linkFor='${element.href}']`);
		if (!existingLink) {
			const openInVsCodeNode = document.createElement('a');
			openInVsCodeNode.setAttribute('data-linkFor', element.href)
			openInVsCodeNode.href = `vscode://file/E:/sources/portail/${filePath}`;
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
			openInVsCodeNode.href = `vscode://file/E:/sources/portail/${filePath}`;
			openInVsCodeNode.textContent = 'open in vscode';
			openInVsCodeNode.style = 'margin-left: 10px;';
			element.after(openInVsCodeNode);
		}

		console.log(filePath);

	}
	console.log("...Listing over.");
	document.addEventListener('DOMNodeInserted', nodeInsertedCallback);

};