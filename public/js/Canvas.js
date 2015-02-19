define(["require", "exports"], function (require, exports) {
    /**
     * Provides canvas control and usage functionality.
     */
    var Canvas;
    (function (Canvas) {
        /**
         * Provides a render loop for a canvas.
         */
        var RenderLoop = (function () {
            /**
             * Create a new full canvas controller.
             * @param canvas the canvas element to control
             * @param client the client of the full canvas controller
             */
            function RenderLoop(canvas, client) {
                this._mouse = new MouseState();
                this._started = false;
                this._canvas = canvas;
                this._client = client;
                // save this
                var self = this;
                // update mouse state on mouse move and re-render
                this._canvas.addEventListener("mousemove", function (event) {
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
            RenderLoop.prototype.start = function () {
                if (this._started)
                    throw "already started";
                this._started = true;
                this._client.init(this._canvas.width, this._canvas.height);
                this._timestamp = Date.now();
                var self = this;
                window.setInterval(function () { return self.render(); }, 30);
            };
            /**
             * Runs a render loop cycle.
             */
            RenderLoop.prototype.render = function () {
                // see how much time has passed since last render cycle
                var now = Date.now();
                var interval = now - this._timestamp;
                this._timestamp = now;
                if (interval < 0)
                    interval = 1;
                if (interval > 100)
                    interval = 100;
                // have the client update their model
                this._client.update(interval, this._canvas.width, this._canvas.height, this._mouse);
                // have the client draw
                var ctx = this._canvas.getContext("2d");
                ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
                this._client.draw(ctx, this._canvas.width, this._canvas.height, this._mouse);
            };
            return RenderLoop;
        })();
        Canvas.RenderLoop = RenderLoop;
        /**
         * Keeps the provided canvas fully sized to the window.
         * @param canvas the canvas to keep full size
         */
        function keepFullSize(canvas) {
            function resize() {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
            window.onresize = resize;
            resize();
        }
        Canvas.keepFullSize = keepFullSize;
        /**
         * Encapsulates the state of the mouse.
         */
        var MouseState = (function () {
            function MouseState() {
            }
            return MouseState;
        })();
        Canvas.MouseState = MouseState;
    })(Canvas || (Canvas = {}));
    return Canvas;
});
//# sourceMappingURL=Canvas.js.map