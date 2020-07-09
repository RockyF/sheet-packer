# sheet-packer
pack images to sheets

# Install
`npm install sheet-packer`

# Usage
```javascript
const fs = require('fs');
const pack = require("./dist");

const files = fs.readdirSync('assets').map(file => 'assets/' + file);

(async function () {
	let {sheets} = await pack(files, {
		outputDir: 'output',
	});
})();
```
