namespace util {

	export interface HSL {
		h: number;
		s: number;
		l: number;
	}

	/**
	 * Converts hsl color to rgb
	 * Uses this tutorial: https://css-tricks.com/converting-color-spaces-in-javascript/
	 * @param hsl 	hsl color in HSL data structure
	 * @return 		rgb color in "#RRGGBB" format
	 */
	export const hsl2rgb = (hsl: HSL): string => {
		const c = (1 - Math.abs(2 * hsl.l - 1)) * hsl.s;
		const x = c * (1 - Math.abs((hsl.h / 60) % 2 - 1));
		const m = hsl.l - c / 2;

		let r = 0;
		let g = 0;
		let b = 0;

		if (hsl.h >= 0 && hsl.h < 60) {
			r = c;
			g = x;
			b = 0;
		} else if (hsl.h >= 60 && hsl.h < 120) {
			r = x;
			g = c;
			b = 0;
		} else if (hsl.h >= 120 && hsl.h < 180) {
			r = 0;
			g = c;
			b = x;
		} else if (hsl.h >= 180 && hsl.h < 240) {
			r = 0;
			g = x;
			b = c;
		} else if (hsl.h >= 240 && hsl.h < 300) {
			r = x;
			g = 0;
			b = c;
		} else {
			r = c;
			g = 0;
			b = x;
		}

		r = Math.round((r + m) * 255);
		g = Math.round((g + m) * 255);
		b = Math.round((b + m) * 255);

		let result = (r << 16) | (g << 8) | b;

		return "#" + result.toString(16).padStart(6, "0");
	};

	/**
	 * Converts rgb color to hsl color
	 * Uses this tutorial: https://css-tricks.com/converting-color-spaces-in-javascript/
	 * @param rgb 	color in "#RRGGBB" format
	 * @return 		color in hsl format
	 */
	export const rgb2hsl = (rgb: string) => {
		const result: HSL = { h: 0, s: 0, l: 0 };

		rgb = rgb.substring(1);
		let r = parseInt(rgb.substring(0, 2), 16) / 255;
		let g = parseInt(rgb.substring(2, 4), 16) / 255;
		let b = parseInt(rgb.substring(4, 6), 16) / 255;

		let cMin = Math.min(r, g, b);
		let cMax = Math.max(r, g, b);
		let delta = cMax - cMin;

		//calculate lightness
		result.l = (cMax + cMin) / 2;

		//calculate saturation
		result.s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * result.l - 1));

		//calculate hue
		if (delta == 0) { //special case to prevent division by 0
			result.h = 0;
		} else if (cMax == r) {
			result.h = (g - b) / delta;
		} else if (cMax == g) {
			result.h = (b - r) / delta + 2;
		} else {
			result.h = (r - g) / delta + 4;
		}
		result.h *= 60;
		while (result.h < 0) {
			result.h += 360;
		}

		return result;
	}
}