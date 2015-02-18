import FullCanvas = require("./fullcanvas");

module Grow {

	/**
	 * The amount of randomization to do in the randomize() function.
	 * @type {number}
	 */
	var RANDOMIZE_FACTOR:number = 0.05;

	/**
	 * Randomize a number by scaling up or down by randomize factor.
	 * @param n the number to randomize
	 * @returns {number} the randomized number
	 */
	function randomize(n:number):number {
		return n * (Math.random() * 2 * RANDOMIZE_FACTOR + 1 - RANDOMIZE_FACTOR);
	}

	/**
	 * Normalize an angle (in radians) to between 0 and 2 Pi.
	 * @param angle the angle to normalize
	 * @returns {number} the normalized angle
	 */
	function normalizeAngle(angle:number):number {
		while (angle < 0) {
			angle += 2 * Math.PI;
		}
		while (angle >= 2 * Math.PI) {
			angle -= 2 * Math.PI;
		}
		return angle;
	}

	/**
	 * The environment in which growth occurs.
	 */
	class Environment {
		/**
		 * A factor to multiply by interval before using in calculations.  Determines how
		 * quickly the growth takes place.
		 * @type {number}
		 */
		public INTERVAL_FACTOR:number = 1 / 50;

		/**
		 * Controls the rate at which sticks and fruit wither away.  This value increases
		 * as the growth progresses.
		 * @type {number}
		 */
		public WITHER_RATE:number = 0.00001;

		/**
		 * Determines the maximum wither rate before the wither rate stops increasing.
		 * @type {number}
		 */
		public MAX_WITHER_RATE:number = 0.1;

		/**
		 * Determines how quickly the wither rate increases to its maximum.
		 * @type {number}
		 */
		public WITHER_RATE_MULTIPLIER = 1.004;

		/**
		 * The final length of a withered stick.
		 * @type {number}
		 */
		public WITHER_LENGTH:number = 4;

		/**
		 * The final angle (positive or negative) of a withered stick.
		 * @type {number}
		 */
		public STICK_WITHER_ANGLE:number = Math.PI / 3;

		/**
		 * The target radius of a ripe fruit.
		 * @type {number}
		 */
		public TARGET_FRUIT_RADIUS:number = 4;

		/**
		 * The final radius of a withered fruit.
		 * @type {number}
		 */
		public WITHER_FRUIT_RADIUS:number = 0;

		/**
		 * The probability of multiple branches occurring at a branch point. This
		 * probability will decrease to zero a the maximum stick depth is approached.
		 * @type {number}
		 */
		public BRANCH_PROBABILITY:number = 0.08;

		/**
		 * The amount that branches curve.
		 * @type {number}
		 */
		public BRANCH_CURVE:number = 1.0;

		/**
		 * The maximum depth of sticks on a branch before fruiting.
		 * @type {number}
		 */
		public MAX_STICK_DEPTH:number = 80;

	}

	/**
	 * Functionality for an individual branch.
	 */
	interface Branch {

		/**
		 * Grow the branch.
		 * @param interval the interval of time passed since it last grew.
		 * @param stack the stack of branches remaining to be grown; this
		 * method should push any child branches onto the stack
		 */
		grow(interval:number, stack:Array<Branch>):void;

		/**
		 * Draw the branch.
		 * @param ctx the 2d canvas context to use to draw
		 * @param width the width of the canvas
		 * @param height the height of the canvas
		 * @param startx the x coordinate where the branch should start drawing from
		 * @param starty the y coordinate where the branch should start drawing from
		 * @param refAngle the angle of the branch's parent
		 * @param stack the stack of branch contexts remaining to be draw; this method
		 * should push a branch context onto the stack for any child branches
		 */
		draw(ctx:CanvasRenderingContext2D, width:number, height:number, startx:number, starty:number, refAngle:number, stack:Array<BranchDrawContext>);
	}

	/**
	 * A branch and its drawing context.
	 */
	class BranchDrawContext {

		/**
		 * The branch to be drawn.
		 */
		public branch:Branch;

		/**
		 * The x coordinate where the branch should draw from.
		 */
		public x:number;

		/**
		 * The y coordinate where the branch should draw from.
		 */
		public y:number;

		/**
		 * The reference angle the branch should draw from.
		 */
		public angle:number;

		constructor(branch:Branch, x:number, y:number, angle:number) {
			this.branch = branch;
			this.x = x;
			this.y = y;
			this.angle = angle;
		}
	}

	/**
	 * A stick, which is a kind of branch.
	 */
	class Stick implements Branch {
		// growth environment
		private _env:Environment;

		// child branches
		private _branches:Array<Branch> = [];

		// current length of the branch
		private _length:number = 0;

		// current angle of the branch
		private _angle:number = 0;

		// how leafy (green) the branch is
		private _leafiness:number = 1;

		// the target length of the branch (before withering)
		private _targetLength:number;

		// the target angle of the branch (before withering)
		private _targetAngle:number;

		// how fast the branch should grow
		private _growthRate: number;

		// how deep this branch is (how many ancestors it has)
		private _depth:number;

		// the target angle of the branch (after withering)
		private _witherAngle:number;

		constructor(env:Environment, targetLength:number, targetAngle: number, growthRate: number, depth: number) {
			this._env = env;
			this._targetLength = randomize(targetLength);
			this._targetAngle = randomize(targetAngle);
			this._growthRate = randomize(growthRate);
			this._depth = depth;
			this._witherAngle = this._targetAngle > 0 ? this._env.STICK_WITHER_ANGLE : -this._env.STICK_WITHER_ANGLE;
		}

		public grow(interval:number, stack:Array<Branch>) {
			// scale the interval
			interval *= this._env.INTERVAL_FACTOR;

			if (this._branches.length === 0) {
				// now child branches, so keep growing
				this._length += (this._targetLength - this._length) * this._growthRate * interval;
				this._angle += (this._targetAngle - this._angle) * this._growthRate * interval;
			} else {
				// we have child branches, so wither now
				this._length += (this._env.WITHER_LENGTH - this._length) * this._env.WITHER_RATE * interval;
				this._angle += (this._witherAngle - this._angle) * this._env.WITHER_RATE * interval;
			}

			if (this._branches.length === 0 && Math.pow((this._length / this._targetLength), 2) > Math.random()) {
				// looks like its time to spawn a child branch
				if (this._depth < this._env.MAX_STICK_DEPTH) {
					// child branch is a stick, or maybe multiple
					while ((this._branches.length === 0 || Math.random() > (1 - this._env.BRANCH_PROBABILITY) + (this._env.BRANCH_PROBABILITY * (this._depth / this._env.MAX_STICK_DEPTH)))) {
						this._branches.push(new Stick(
							this._env,
							this._targetLength,
							Math.random() * 2 * this._env.BRANCH_CURVE - this._env.BRANCH_CURVE,
							this._growthRate,
							this._depth + 1));
					}
				} else {
					// child branch is a fruit
					this._branches.push(new Fruit(this._env, this._growthRate));
				}
			}

			if (this._branches.length > 0) {
				// decrease leafiness once we've got a child
				this._leafiness *= (1 - 0.01 * interval);
			}

			this._branches.forEach(function(branch) {
				// grow child branches
				stack.push(branch);
			});
		}

		public draw(ctx:CanvasRenderingContext2D, width:number, height:number, startx:number, starty:number, refAngle:number, stack:Array<BranchDrawContext>) {
			// draw x, y, and angle relative to reference coordinates and angle
			var drawAngle = normalizeAngle(refAngle + this._angle);
			var endx = startx + Math.cos(drawAngle) * this._length;
			var endy = starty + Math.sin(drawAngle) * this._length;

			// draw
			ctx.beginPath();
			ctx.moveTo(startx, height - starty);
			ctx.lineTo(endx, height - endy);

			// green-ness depends on leafiness
			ctx.strokeStyle = "rgb(0," + Math.floor(this._leafiness * 200) + ",0)";
			ctx.stroke();

			// draw children
			this._branches.forEach(function(branch) {
				stack.push(new BranchDrawContext(branch, endx, endy, drawAngle));
			});
		}
	}

	/**
	 * A fruit is at the very end of a branch sequence.
	 */
	class Fruit implements Branch {
		// growth environment
		private _env:Environment;

		// current radius of the fruit
		private _radius:number = 0;

		// how ripe the fruit is (determines its color)
		private _ripeness:number = 1;

		// whether the fruit is dying
		private _dying:boolean = false;

		// the target radius of the fruit when ripe
		private _targetRadius:number;

		// how fast the fruit is growing
		private _growthRate:number;

		constructor(env:Environment, growthRate:number) {
			this._env = env;
			this._growthRate = randomize(growthRate);
			this._targetRadius = randomize(this._env.TARGET_FRUIT_RADIUS);
		}

		grow(interval) {
			// scale the interval
			interval *= this._env.INTERVAL_FACTOR;

			if (this._dying) {
				// if dying, then we are withering and over-ripening
				this._radius += (this._env.WITHER_FRUIT_RADIUS - this._radius) * this._env.WITHER_RATE * interval;
				this._ripeness *= (1 - 0.01 * interval);
			} else {
				// if not dying then we are growing and ripening
				this._radius += (this._env.TARGET_FRUIT_RADIUS - this._radius) * this._growthRate * interval;
				this._ripeness *= (1 - 0.01 * interval);
				if (this._ripeness < 0.01) {
					// we've reached full ripeness, so start dying
					this._dying = true;
					this._ripeness = 1;
				}
			}
		}

		draw(ctx, width, height, x, y) {
			// draw the fruit
			ctx.beginPath();
			ctx.arc(x, height - y, this._radius, 2 * Math.PI, false);
			if (this._dying) {
				// if dying, then become blacker as we over ripen
				ctx.fillStyle = "rgb(" +
				Math.floor(this._ripeness * 200) + "," +
				"0," +
				Math.floor(this._ripeness * 50) + ")";
			} else {
				// if not dying, then turn from green to red as ripening
				ctx.fillStyle = "rgb(" +
				Math.floor((1 - this._ripeness) * 200) + "," +
				Math.floor(this._ripeness * 150) + "," +
				Math.floor((1 - this._ripeness) * 50) + ")";
			}
			ctx.fill();
		}
	}

	/**
	 * Implements the FullCanvas.Client interfaces for a Grow animation.
	 */
	export class Client implements FullCanvas.Client {
		// root trunk sticks drawing contexts
		private _trunks:Array<BranchDrawContext> = [];

		// growth environment
		private _env:Environment = new Environment();

		init(width:number, height:number) {
			// init trunks
			this._trunks.push(new BranchDrawContext(new Stick(this._env, 6, 0, 0.1, 0), width / 2, height / 2, Math.PI / 2));
			this._trunks.push(new BranchDrawContext(new Stick(this._env, 6, 0, 0.1, 0), width / 2, height / 2, Math.PI / 2 - 2 * Math.PI / 3));
			this._trunks.push(new BranchDrawContext(new Stick(this._env, 6, 0, 0.1, 0), width / 2, height / 2, Math.PI / 2 + 2 * Math.PI / 3));
		}

		update(interval:number, width:number, height:number, mouse:FullCanvas.MouseState) {
			// create our stack of branches to grow from our trunks
			var stack:Array<Branch> = this._trunks.map((bc) => bc.branch);

			// grow until nothing left
			while (stack.length > 0) {
				stack.shift().grow(interval, stack);
			}

			// increase wither rate as growth proceeds
			if (this._env.WITHER_RATE < this._env.MAX_WITHER_RATE) {
				this._env.WITHER_RATE *= this._env.WITHER_RATE_MULTIPLIER;
			}
		}

		draw(ctx:CanvasRenderingContext2D, width:number, height:number, mouse:FullCanvas.MouseState) {
			// update x and y for trunks to be in the center of the canvas
			this._trunks.forEach((bc) => {
				bc.x = width / 2;
				bc.y = height / 2;
			});

			// create our stack of branches to draw from our trunks
			var stack:Array<BranchDrawContext> = this._trunks.slice(0);

			// draw until nothing left
			while (stack.length > 0) {
				var d = stack.shift();
				d.branch.draw(ctx, width, height, d.x, d.y, d.angle, stack);
			}
		}
	}

	/**
	 * A factory for our grow clients.
	 */
	export class ClientFactory implements FullCanvas.ClientFactory {
		create():Client {
			return new Client();
		}
	}

	export function createClientFactory():ClientFactory {
		return new ClientFactory();
	}
}

export = Grow;
