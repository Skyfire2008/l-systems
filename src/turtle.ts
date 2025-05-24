namespace lSystem {

	/**Turtle state to store in the stack */
	interface TurtleState {
		x: number;
		y: number;
		angle: number;
		dist: number;
	}

	export class Turtle {

		private dist: number;
		private delta: number;
		private distScale: number;

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
			this.actions.set(">", this.multDist);
			this.actions.set("<", this.divDist);

			this.calibrationActions = new Map<string, () => void>();
			this.calibrationActions.set("[", this.push);
			this.calibrationActions.set("]", () => {
				const state = this.stack.pop();
				this.x = state.x;
				this.y = state.y;
				this.angle = state.angle;
				this.dist = state.dist;
			});
			this.calibrationActions.set("+", this.turnLeft);
			this.calibrationActions.set("-", this.turnRight);
			const nextPos = () => {
				this.x += Math.cos(this.angle) * this.dist;
				this.y += Math.sin(this.angle) * this.dist;
			};
			this.calibrationActions.set("F", nextPos);
			this.calibrationActions.set("f", nextPos);
			this.calibrationActions.set(">", this.multDist);
			this.calibrationActions.set("<", this.divDist);
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

			const seqArray = seq.split("");
			for (const c of seqArray) {
				const action = this.calibrationActions.get(c);
				if (action !== undefined) {
					action.bind(this)();
					maxX = Math.max(this.x, maxX);
					minX = Math.min(this.x, minX);
					maxY = Math.max(this.y, maxY);
					minY = Math.min(this.y, minY);
				}
			}

			const drawingWidth = maxX - minX;
			const drawingHeight = maxY - minY;
			//subtract 2 from width and height to give a margin of 1 pixel
			this.scale = 1.0 / Math.max(drawingWidth / (width - 2), drawingHeight / (height - 2));

			this.x = (width / 2 - minX) * this.scale + 1;
			this.y = (height / 2 - minY) * this.scale + 1;
			this.angle = -Math.PI / 2;
			this.stack = [];
		}

		/**
		 * Draw the given sequence of characters onto the given rendering context
		 * @param seq 		sequence to draw
		 * @param dist		default move distance
		 * @param delta		default turn angle
		 * @param distScale move distance scaling factor
		 * @param ctx 		rendering context
		 */
		public draw(seq: string, dist: number, delta: number, distScale: number, ctx: CanvasRenderingContext2D) {
			//set the settings
			this.dist = dist;
			this.delta = delta;
			this.distScale = distScale;

			//first calibrate...
			this.calibrate(seq, ctx.canvas.width, ctx.canvas.width);

			//restore state
			this.dist = dist;
			this.delta = delta;

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
			//floor the pixel coordinates and add 0.5 so that the line is drawn to the middle of the pixel
			ctx.lineTo(Math.floor(this.x) + 0.5, Math.floor(this.y) + 0.5);
		}

		/**
		 * Move forward one step without drawing
		 * @param ctx rendering context
		 */
		private move(ctx: CanvasRenderingContext2D) {
			this.x += Math.cos(this.angle) * this.dist * this.scale;
			this.y += Math.sin(this.angle) * this.dist * this.scale;
			ctx.moveTo(Math.floor(this.x) + 0.5, Math.floor(this.y) + 0.5);
		}

		private multDist(ctx: CanvasRenderingContext2D) {
			this.dist *= this.distScale;
		}

		private divDist(ctx: CanvasRenderingContext2D) {
			this.dist /= this.distScale;
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
				dist: this.dist
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
			this.angle = state.angle;
			this.dist = state.dist;
			ctx.moveTo(Math.floor(this.x) + 0.5, Math.floor(this.y) + 0.5);
		}

		/**
		 * Turn right
		 * @param ctx rendering context
		 */
		private turnRight(ctx: CanvasRenderingContext2D) {
			//turn directions are flipped because the canvas' y-axis is also flipped
			this.angle += this.delta;
		}

		/**
		 * Turn left
		 * @param ctx rendering context
		 */
		private turnLeft(ctx: CanvasRenderingContext2D) {
			this.angle -= this.delta;
		}
	}
}