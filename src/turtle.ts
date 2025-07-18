namespace lSystem {

	/**Turtle state to store in the stack */
	interface TurtleState {
		x: number;
		y: number;
		dist: number;
		angle: number;
		turnAngle: number;
		lineWidth: number;
		color: string;
	}

	export interface Bounds {
		minX: number;
		maxX: number;
		minY: number;
		maxY: number;
		startX: number;
		startY: number;
	}

	export interface TurtleSettings {
		dist: number;
		distScale: number;
		turnAngle: number;
		turnScale: number;
		lineWidth: number;
		widthScale: number;
		colors: Array<string>;
		colorMod: util.HSL;
	}

	export class Turtle {

		private dist: number;
		private distScale: number;
		private turnAngle: number;
		private turnScale: number;
		private lineWidth: number;
		private widthScale: number;

		private colors: Array<string>;
		private colorMod: util.HSL;
		private color: string;

		private scale = 1;

		private x = 0;
		private y = 0;
		/**angle in radians */
		private angle = 0;
		private stack: Array<TurtleState> = [];

		//set of actions for drawing and calibration so that the actions can be fetched using the characters without using the switch...case
		private actions: Map<string, (ctx: CanvasRenderingContext2D) => void>;
		private calibrationActions: Map<string, (any) => void>;

		constructor() {
			this.actions = new Map<string, (ctx: CanvasRenderingContext2D) => void>();
			this.actions.set("C", this.drawCircle);
			this.actions.set("F", this.drawLine);
			this.actions.set("f", this.move);
			this.actions.set("[", this.push);
			this.actions.set("]", this.pop);
			this.actions.set("+", this.turnLeft);
			this.actions.set("-", this.turnRight);
			this.actions.set("*", this.multTurnAngle);
			this.actions.set("/", this.divTurnAngle);
			this.actions.set("|", this.flip);
			this.actions.set(">", this.multDist);
			this.actions.set("<", this.divDist);
			this.actions.set("#", this.multLineWidth);
			this.actions.set("!", this.divLineWidth);
			this.actions.set("0", this.setColor.bind(this, 0));
			this.actions.set("1", this.setColor.bind(this, 1));
			this.actions.set("2", this.setColor.bind(this, 2));
			this.actions.set("3", this.setColor.bind(this, 3));
			this.actions.set("4", this.setColor.bind(this, 4));
			this.actions.set("5", this.setColor.bind(this, 5));
			this.actions.set("6", this.setColor.bind(this, 6));
			this.actions.set("7", this.setColor.bind(this, 7));
			this.actions.set("8", this.setColor.bind(this, 8));
			this.actions.set("9", this.setColor.bind(this, 9));
			this.actions.set("H", this.modColorFw);
			this.actions.set("h", this.modColorB);

			this.calibrationActions = new Map<string, () => void>();
			this.calibrationActions.set("[", this.push);
			this.calibrationActions.set("]", () => {
				const state = this.stack.pop();
				this.x = state.x;
				this.y = state.y;
				this.angle = state.angle;
				this.turnAngle = state.turnAngle;
				this.dist = state.dist;
				this.lineWidth = state.lineWidth;
			});
			this.calibrationActions.set("+", this.turnLeft);
			this.calibrationActions.set("-", this.turnRight);
			this.calibrationActions.set("*", this.multTurnAngle);
			this.calibrationActions.set("/", this.divTurnAngle);
			this.calibrationActions.set("|", this.flip);
			const nextPos = () => {
				this.x += Math.cos(this.angle) * this.dist;
				this.y += Math.sin(this.angle) * this.dist;
			};
			this.calibrationActions.set("F", nextPos);
			this.calibrationActions.set("f", nextPos);
			this.calibrationActions.set(">", this.multDist);
			this.calibrationActions.set("<", this.divDist);
			this.calibrationActions.set("#", () => {
				this.lineWidth *= this.widthScale;
			});
			this.calibrationActions.set("!", () => {
				this.lineWidth /= this.widthScale;
			});
		}

		/**
		 * Calculates the scaling and starting position of the turtle to fit the drawing into the canvas
		 * @param seq sequence of L-system characters to draw
		 * @param width canvas width
		 * @param height canvas height
		 */
		public calibrate(seq: string, width: number, height: number) {
			this.x = width / 2;
			this.y = height / 2;
			this.angle = -Math.PI / 2;
			this.stack = [];

			let maxX = this.x;
			let maxY = this.y;
			let minX = this.x;
			let minY = this.y;

			let maxWidth = 1;

			const seqArray = seq.split("");
			for (const c of seqArray) {
				const action = this.calibrationActions.get(c);
				if (action !== undefined) {
					action.bind(this)();

					maxX = Math.max(this.x, maxX);
					minX = Math.min(this.x, minX);
					maxY = Math.max(this.y, maxY);
					minY = Math.min(this.y, minY);

					maxWidth = Math.max(maxWidth, this.lineWidth);
				} else if (c == "C") { //special case for circle
					maxX = Math.max(this.x + this.dist, maxX);
					minX = Math.min(this.x - this.dist, minX);
					maxY = Math.max(this.y + this.dist, maxY);
					minY = Math.min(this.y - this.dist, minY);
				}
			}

			const drawingWidth = maxX - minX;
			const drawingHeight = maxY - minY;
			//subtract double maxWidth from width and height to give the margin
			maxWidth = maxWidth < 1 ? 0 : maxWidth;
			this.scale = 1.0 / Math.max(drawingWidth / width, drawingHeight / height);

			this.x = (width / 2 - minX) * this.scale;
			this.y = (height / 2 - minY) * this.scale;
			this.angle = -Math.PI / 2;
			this.stack = [];
		}

		/**
		 * Draw the given sequence of characters onto the given rendering context
		 * @param seq 		sequence to draw
		 * @param settings	initial turtle settings
		 * @param ctx 		rendering context
		 */
		public draw(seq: string, settings: TurtleSettings, ctx: CanvasRenderingContext2D) {
			//set the settings
			this.dist = settings.dist;
			this.distScale = settings.distScale;
			this.turnAngle = settings.turnAngle;
			this.turnScale = settings.turnScale
			this.lineWidth = settings.lineWidth;
			this.widthScale = settings.widthScale;
			this.colors = settings.colors;
			this.colorMod = settings.colorMod;
			this.color = settings.colors[0];

			//first calibrate...
			this.calibrate(seq, ctx.canvas.width, ctx.canvas.width);

			//restore state
			this.dist = settings.dist;
			this.turnAngle = settings.turnAngle;
			this.lineWidth = settings.lineWidth;
			ctx.lineWidth = this.lineWidth;
			ctx.strokeStyle = this.color;

			//then draw normally
			const seqArray = seq.split("");
			ctx.beginPath();
			ctx.moveTo(this.x, this.y);

			for (const c of seqArray) {
				const action = this.actions.get(c);
				if (action !== undefined) {
					action.bind(this, ctx)();
				}
			}

			ctx.stroke();
		}

		/**
		 * Move forward one step and draw line
		 * @param ctx rendering context
		 */
		private drawLine(ctx: CanvasRenderingContext2D) {
			this.x += Math.cos(this.angle) * this.dist * this.scale;
			this.y += Math.sin(this.angle) * this.dist * this.scale;

			ctx.lineTo(this.x, this.y);
			//floor the pixel coordinates and add 0.5 so that the line is drawn to the middle of the pixel
			//ctx.lineTo(Math.floor(this.x) + 0.5, Math.floor(this.y) + 0.5);
		}

		/**
		 * Move forward one step without drawing
		 * @param ctx rendering context
		 */
		private move(ctx: CanvasRenderingContext2D) {
			this.x += Math.cos(this.angle) * this.dist * this.scale;
			this.y += Math.sin(this.angle) * this.dist * this.scale;
			ctx.moveTo(this.x, this.y);
			//ctx.moveTo(Math.floor(this.x) + 0.5, Math.floor(this.y) + 0.5);
		}

		private drawCircle(ctx: CanvasRenderingContext2D) {
			const path = new Path2D();
			path.arc(this.x, this.y, this.dist * this.scale, 0, Math.PI * 2);
			ctx.fillStyle = this.color;
			ctx.fill(path);
		}

		private multLineWidth(ctx: CanvasRenderingContext2D) {
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(this.x, this.y);
			this.lineWidth *= this.widthScale;
			ctx.lineWidth = this.lineWidth;
		}

		private divLineWidth(ctx: CanvasRenderingContext2D) {
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(this.x, this.y);
			this.lineWidth /= this.widthScale;
			ctx.lineWidth = this.lineWidth;
		}

		private setColor(i: number, ctx: CanvasRenderingContext2D) {
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(this.x, this.y);
			this.color = this.colors[i];
			ctx.strokeStyle = this.color;
		}

		private modColorFw(ctx: CanvasRenderingContext2D) {
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(this.x, this.y);

			const hsl = util.rgb2hsl(this.color);
			hsl.h = (hsl.h + this.colorMod.h) % 360;
			while (hsl.h < 0) {
				hsl.h += 360;
			}
			hsl.s = Math.max(Math.min(1.0, hsl.s * this.colorMod.s), 0);
			hsl.l = Math.max(Math.min(1.0, hsl.l * this.colorMod.l), 0);

			this.color = util.hsl2rgb(hsl);
			ctx.strokeStyle = this.color;
		}

		private modColorB(ctx: CanvasRenderingContext2D) {
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(this.x, this.y);

			const hsl = util.rgb2hsl(this.color);
			hsl.h = (hsl.h - this.colorMod.h) % 360;
			while (hsl.h < 0) {
				hsl.h += 360;
			}
			hsl.s = Math.max(Math.min(1.0, hsl.s / this.colorMod.s), 0);
			hsl.l = Math.max(Math.min(1.0, hsl.l / this.colorMod.l), 0);

			this.color = util.hsl2rgb(hsl);
			ctx.strokeStyle = this.color;
		}

		private flip(ctx: CanvasRenderingContext2D) {
			this.turnAngle *= -1;
		}

		private multDist(ctx: CanvasRenderingContext2D) {
			this.dist *= this.distScale;
		}

		private divDist(ctx: CanvasRenderingContext2D) {
			this.dist /= this.distScale;
		}

		private multTurnAngle(ctx: CanvasRenderingContext2D) {
			this.turnAngle *= this.turnScale;
		}

		private divTurnAngle(ctx: CanvasRenderingContext2D) {
			this.turnAngle /= this.turnScale;
		}

		/**
		 * Push the curretn state onto the stack
		 * @param ctx rendering context
		 */
		private push(ctx: CanvasRenderingContext2D) {
			this.stack.push({
				x: this.x,
				y: this.y,
				angle: this.angle,
				turnAngle: this.turnAngle,
				dist: this.dist,
				lineWidth: this.lineWidth,
				color: this.color
			});
		}

		/**
		 * Pop the state from the stack
		 * @param ctx rendering context
		 */
		private pop(ctx: CanvasRenderingContext2D) {
			const state = this.stack.pop();
			this.x = state.x;
			this.y = state.y;
			this.dist = state.dist;
			this.angle = state.angle;
			this.turnAngle = state.turnAngle;
			this.lineWidth = state.lineWidth;
			this.color = state.color;
			ctx.stroke();
			ctx.beginPath();
			ctx.lineWidth = this.lineWidth;
			ctx.strokeStyle = this.color;
			ctx.moveTo(Math.floor(this.x) + 0.5, Math.floor(this.y) + 0.5);
		}

		/**
		 * Turn right
		 * @param ctx rendering context
		 */
		private turnRight(ctx: CanvasRenderingContext2D) {
			//turn directions are flipped because the canvas' y-axis is also flipped
			this.angle += this.turnAngle;
		}

		/**
		 * Turn left
		 * @param ctx rendering context
		 */
		private turnLeft(ctx: CanvasRenderingContext2D) {
			this.angle -= this.turnAngle;
		}
	}
}