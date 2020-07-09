/**
 * Created by rockyl on 2020-05-14.
 */

const fs = require('fs');
const pack = require("./dist");

const files = fs.readdirSync('assets').map(file => 'assets/' + file);

(async function () {
	let {sheets} = await pack(files, {
		maxSize: 200,
		outputDir: 'output',
		sheetExtname: '.json',
		sheetFormat: true,
	});
})();
