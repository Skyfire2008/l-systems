"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const port = parseInt(process.argv[2]);
const dirPath = process.argv[3];

const fileMap = new Map();

/**
 * Loads a directory's contents recursively into the file map
 * @param currentPath	path to directory
 */
const loadDirRec = (currentPath) => {
	const children = fs.readdirSync(currentPath);
	for (child of children) {
		const childPath = path.join(currentPath, child)
		const stats = fs.statSync(childPath);

		if (stats.isFile()) {
			const buffer = fs.readFileSync(childPath);
			const urlPath = childPath.substring(dirPath.length);
			fileMap.set(urlPath, buffer);
			console.log("Loaded file " + childPath);
		} else if (stats.isDirectory()) {
			loadDirRec(childPath);
		}
	}
};

loadDirRec(dirPath);
console.log(`\nServer running on http:\/\/localhost:${port}`);

const server = http.createServer((req, res) => {
	const filePath = path.normalize(req.url);
	console.log("Requested file" + filePath);
	if (fileMap.has(filePath)) {
		res.setHeader("Cross-Origin-Embedder-Policy", "require-corp"); //set headers to allow shared memory to be used in js
		res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
		res.writeHead(200);
		res.write(fileMap.get(filePath));
		res.end();
		console.log("File found");
	} else {
		res.writeHead(404);
		res.end("File " + filePath + "not found");
		console.log("File not found");
	}
});

server.listen(port, "localhost");