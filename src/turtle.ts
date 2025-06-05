namespace lSystem {

	/**Turtle state to store in the stack */
	interface TurtleState {
		x: number;
		y: number;
		dist: number;
		angle: number;
		turnAngle: number;
		lineWidth: number;
	}

	export interface TurtleSettings {
		dist: number;
		distScale: number;
		turnAngle: number;
		turnScale: number;
		lineWidth: number;
	}

	export class Turtle {

		private dist: number;
		private distScale: number;
		private turnAngle: number;
		private turnScale: number;
		private lineWidth: number;

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
			this.actions.set("F", this.drawLine);
			this.actions.set("f", this.move);
			this.actions.set("[", this.push);
			this.actions.set("]", this.pop);
			this.actions.set("+", this.turnLeft);
			this.actions.set("-", this.turnRight);
			this.actions.set("*", this.multTurnAngle);
			this.actions.set("/", this.divTurnAngle);
			this.actions.set(">", this.multDist);
			this.actions.set("<", this.divDist);
			this.actions.set("#", this.multLineWidth);
			this.actions.set("!", this.divLineWidth);

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
			const nextPos = () => {
				this.x += Math.cos(this.angle) * this.dist;
				this.y += Math.sin(this.angle) * this.dist;
			};
			this.calibrationActions.set("F", nextPos);
			this.calibrationActions.set("f", nextPos);
			this.calibrationActions.set(">", this.multDist);
			this.calibrationActions.set("<", this.divDist);
			this.calibrationActions.set("#", () => {
				this.lineWidth *= this.distScale;
			});
			this.calibrationActions.set("!", () => {
				this.lineWidth /= this.distScale;
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

			let maxX = Number.NEGATIVE_INFINITY;
			let maxY = Number.NEGATIVE_INFINITY;
			let minX = Number.POSITIVE_INFINITY;
			let minY = Number.POSITIVE_INFINITY;

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
				}
			}

			const drawingWidth = maxX - minX;
			const drawingHeight = maxY - minY;
			//subtract double maxWidth from width and height to give the margin
			maxWidth = maxWidth < 1 ? 0 : maxWidth;
			this.scale = 1.0 / Math.max(drawingWidth / (width - 2 * maxWidth), drawingHeight / (height - 2 * maxWidth));

			this.x = (width / 2 - minX) * this.scale + 1;
			this.y = (height / 2 - minY) * this.scale + 1;
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

			//first calibrate...
			this.calibrate(seq, ctx.canvas.width, ctx.canvas.width);

			//restore state
			this.dist = settings.dist;
			this.turnAngle = settings.turnAngle;
			this.lineWidth = settings.lineWidth;
			ctx.lineWidth = this.lineWidth;

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

		private multLineWidth(ctx: CanvasRenderingContext2D) {
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(this.x, this.y);
			this.lineWidth *= this.distScale;
			ctx.lineWidth = this.lineWidth;
		}

		private divLineWidth(ctx: CanvasRenderingContext2D) {
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(this.x, this.y);
			this.lineWidth /= this.distScale;
			ctx.lineWidth = this.lineWidth;
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
				lineWidth: this.lineWidth
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
			ctx.stroke();
			ctx.beginPath();
			ctx.lineWidth = this.lineWidth;
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