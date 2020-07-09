/**
 * Created by rockyl on 2019-12-08.
 */

import fs from 'fs-extra'
import path from 'path'
import {MaxRectsBinPack} from 'rects-bin-pack'
import {createCanvas, loadImage} from 'canvas'

const canvas = createCanvas(2048, 2048);
const context = canvas.getContext('2d');

export async function pack(sources, options = {}) {
	const {padding = 1, maxSize = 2048, mode = 1,} = options;

	const images = [];
	for (let source of sources) {
		let img = await loadImage(source);
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
			})
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

		let pack = new MaxRectsBinPack(maxSize, maxSize, false);
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
