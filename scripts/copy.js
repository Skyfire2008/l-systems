"use strict";

const fs = require("fs");
const path = require("path");

/**
 * Copies a directory recursively
 * @param src 	path to source directory 
 * @param dest 	path to destination directory
 * @returns 
 */
const copyDir = (src, dest) => {
	return new Promise((resolve, reject) => {
		//get all children of directory
		fs.promises.readdir(src).then((fileNames) => {

			//for each child, check if directory or file
			const promises = fileNames.map((fileName) => {
				const newSrc = path.join(src, fileName);
				const newDest = path.join(dest, fileName);

				return new Promise((resolve, reject) => {
					fs.promises.stat(newSrc).then((stat) => {

						//if file, call checkCopy(...), otherwise call copyDir(...) recursively
						if (stat.isFile()) {
							checkCopy(newSrc, newDest).then(() => resolve());
						} else {
							copyDir(newSrc, newDest).then(() => resolve());
						}
					});
				});
			});

			Promise.all(promises).then(() => resolve());
		});
	});
}

/**
 * Copies a file while also checking if destination directory exists or if file needs copying(newer than destination)
 * @param {*} src 	path to source
 * @param {*} dest 	path to destination
 * @returns 
 */
const checkCopy = (src, dest) => {
	return new Promise((resolve, reject) => {
		const dirName = path.dirname(dest);

		//if destination doesn't exist
		if (!fs.existsSync(dest)) {

			//check if directory exists and create if necessary, then copy
			if (fs.existsSync(dirName)) {
				console.log(`COPIED: ${src}`);
				fs.promises.copyFile(src, dest).then(() => resolve());
			} else {
				fs.promises.mkdir(dirName, { recursive: true }).then(() => {
					console.log(`COPIED: ${src}`);
					fs.promises.copyFile(src, dest).then(() => resolve());
				});
			}
		} else {
			//otherwise check if destination is older than source and copy
			const statPromises = [
				fs.promises.stat(src),
				fs.promises.stat(dest)
			];

			Promise.all(statPromises).then((stats) => {
				//when file stats received, compare modified time
				if (stats[0].mtimeMs > stats[1].mtimeMs) {
					console.log(`COPIED: ${src}`);
					fs.promises.copyFile(src, dest).then(() => resolve());
				} else {
					console.log(`SKIPPED: ${src}`);
					resolve();
				}
			});
		}
	});
};

const promises = [
	//checkCopy("node_modules/react/umd/react.production.min.js", "bin/react.production.min.js"),
	//checkCopy("node_modules/react-dom/umd/react-dom.production.min.js", "bin/react-dom.production.min.js"),
	checkCopy("node_modules/react/umd/react.development.js", "bin/react.development.js"),
	checkCopy("node_modules/react-dom/umd/react-dom.development.js", "bin/react-dom.development.js"),
	checkCopy("src/index.html", "bin/index.html"),
	checkCopy("src/main.css", "bin/main.css")
];

Promise.all(promises).then((value) => {
	console.log("All files copied successfully");
});