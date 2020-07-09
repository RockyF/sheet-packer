'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs = _interopDefault(require('fs-extra'));
var path = _interopDefault(require('path'));
var rectsBinPack = require('rects-bin-pack');
var canvas$1 = require('canvas');

/**
 * Created by rockyl on 2019-12-08.
 */

const canvas = canvas$1.createCanvas(2048, 2048);
const context = canvas.getContext('2d');

async function pack(sources, options = {}) {
	const {padding = 1, maxSize = 2048, mode = 1,} = options;

	const images = [];
	for (let source of sources) {
		let img = await canvas$1.loadImage(source);
		images.push(img);
	}

	let rects = [], singles = [];
	for (let image of images) {
		const {width, height} = image;
		if (width < maxSize && height < maxSize) {
			const rectWidth = width + padding * 2;
			const rectHeight = height + padding * 2;
			rects.push({
				image,
				width: rectWidth,
				height: rectHeight,
				area: rectWidth * rectHeight,
				sourceW: width,
				sourceH: height,
				offX: 0,
				offY: 0,
			});
		} else {
			singles.push(image.src);
		}
	}

	rects.sort((a, b) => {
		return b.area - a.area;
	});

	let remainRects = rects.concat();
	let index = 0;
	let sheets = [];
	while (remainRects.length > 0) {
		let name = 'sheet_' + index;

		let pack = new rectsBinPack.MaxRectsBinPack(maxSize, maxSize, false);
		let packedRects = pack.insert2(remainRects, mode);

		let boundWidth = 0, boundHeight = 0;
		let frames = {};
		for (let rect of packedRects) {
			if(rect.x + rect.width > boundWidth){
				boundWidth = rect.x + rect.width;
			}
			if(rect.y + rect.height > boundHeight){
				boundHeight = rect.y + rect.height;
			}
			frames[rect.image.src] = {
				x: rect.x + padding,
				y: rect.y + padding,
				w: rect.width - padding * 2,
				h: rect.height - padding * 2,
				ox: rect.offX,
				oy: rect.offY,
				sw: rect.sourceW,
				sh: rect.sourceH,
			};
		}

		canvas.width = boundWidth;
		canvas.height = boundHeight;
		context.clearRect(0, 0, boundWidth, boundHeight);
		for (let rect of packedRects) {
			context.drawImage(rect.image, rect.x + padding, rect.y + padding);
		}

		let buffer = canvas.toBuffer();
		let sheet = {
			name,
			frames,
			buffer,
		};

		sheets.push(sheet);

		index++;
	}

	await save(sheets, options);

	return {
		sheets,
		singles,
	};
}

async function save(sheets, options){
	if(!options.outputDir){
		return;
	}

	const {outputDir, sheetExtname = '.sht'} = options;

	await fs.ensureDir(outputDir);
	for (let {name, frames, buffer} of sheets) {
		let imgFile = path.join(outputDir, name + '.png');
		let shtFile = path.join(outputDir, name + sheetExtname);
		await fs.writeFile(imgFile, buffer);
		await fs.writeFile(shtFile, JSON.stringify(frames));
	}
}

/**
 * Created by rockyl on 2020-05-13.
 */

module.exports = pack;
//# sourceMappingURL=index.js.map
