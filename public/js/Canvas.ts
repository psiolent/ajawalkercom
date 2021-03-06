/**
 * Provides canvas control and usage functionality.
 */
module Canvas {
	/**
	 * Provides a render loop for a canvas.
	 */
	export class RenderLoop {
		private _canvas:HTMLCanvasElement;
		private _client:RenderClient;
		private _mouse:MouseState = new MouseState();
		private _started:boolean = false;
		private _timestamp:number;

		/**
		 * Create a new full canvas controller.
		 * @param canvas the canvas element to control
		 * @param client the client of the full canvas controller
		 */
		constructor(canvas:HTMLCanvasElement, client:RenderClient) {
			this._canvas = canvas;
			this._client = client;

			// save this
			var self:RenderLoop = this;

			// update mouse state on mouse move and re-render
			this._canvas.addEventListener("mousemove", function (event:MouseEvent) {
				var rect = self._canvas.getBoundingClientRect();
				self._mouse.x = event.clientX - rect.left;
				self._mouse.y = event.clientY - rect.top;
				self.render();
			}, false);

			// update mouse state on mouse down and re-render
			this._canvas.addEventListener("mousedown", function () {
				self._mouse.down = true;
				self.render();
			}, false);

			// update mouse state on mouse up and re-render
			this._canvas.addEventListener("mouseup", function () {
				self._mouse.down = false;
				self.render();
			}, false);
		}

		/**
		 * Start the render loop. Will throw an exception if called after already started.
		 */
		public start():void {
			if (this._started) throw "already started";
			this._started = true;
			this._client.init(this._canvas.width, this._canvas.height);
			this._timestamp = Date.now();
			var self:RenderLoop = this;
			window.setInterval(() => self.render(), 30);
		}

		/**
		 * Runs a render loop cycle.
		 */
		private render():void {
			// see how much time has passed since last render cycle
			var now:number = Date.now();
			var interval:number = now - this._timestamp;
			this._timestamp = now;
			if (interval < 0) interval = 1;
			if (interval > 100) interval = 100;

			// have the client update their model
			this._client.update(interval, this._canvas.width, this._canvas.height, this._mouse);

			// have the client draw
			var ctx:CanvasRenderingContext2D = this._canvas.getContext("2d");
			ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
			this._client.draw(ctx, this._canvas.width, this._canvas.height, this._mouse);
		}
	}

	/**
	 * The interface for clients which use a render loop.
	 */
	export interface RenderClient {
		/**
		 * Called once after initializing canvas and before starting the render loop.
		 * @param width the width of the canvas
		 * @param height the height of the canvas
		 */
		init(width:number, height:number):void;

		/**
		 * Called when client should update its model.
		 * @param interval how long in milliseconds has passed since last update
		 * @param width the width of the canvas
		 * @param height the height of the canvas
		 * @param mouse the state of the mouse
		 */
		update(interval:number, width:number, height:number, mouse:MouseState):void;

		/**
		 * Called when client should draw.
		 * @param ctx the canvas context to use for drawing (will have been cleared prior to invocation)
		 * @param width the width of the canvas
		 * @param height the height of the canvas
		 * @param mouse the state of the mouse
		 */
		draw(ctx:CanvasRenderingContext2D, width:number, height:number, mouse:MouseState):void;
	}

	/**
	 * Keeps the provided canvas fully sized to the window.
	 * @param canvas the canvas to keep full size
	 */
	export function keepFullSize(canvas:HTMLCanvasElement) {
		function resize() {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		}
		window.onresize = resize;
		resize();
	}

	/**
	 * Encapsulates the state of the mouse.
	 */
	export class MouseState {
		/**
		 * The x-coordinate of the mouse.
		 */
		public x:number;

		/**
		 * The y-coordinate of the mouse.
		 */
		public y:number;

		/**
		 * Whether the mouse button is down.
		 */
		public down:boolean;
	}
}

export = Canvas;
