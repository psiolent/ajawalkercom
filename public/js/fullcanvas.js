define(["require", "exports"], function (require, exports) {
    /**
     * Provides a full-window canvas with a rendering loop.
     */
    var FullCanvas;
    (function (FullCanvas) {
        /**
         * A controller for a full canvas. Manages sizing the canvas to full window size
         * and invoking client methods from the render loop.
         */
        var Controller = (function () {
            /**
             * Create a new full canvas controller.
             * @param canvas the canvas element to control
             * @param client the client of the full canvas controller
             */
            function Controller(canvas, client) {
                this._mouse = new MouseState();
                this._started = false;
                this._canvas = canvas;
                this._client = client;
                // save this
                var self = this;
                // render mouse state on mouse move
                this._canvas.addEventListener("mousemove", function (event) {
                    var rect = self._canvas.getBoundingClientRect();
                    self._mouse.x = event.clientX - rect.left;
                    self._mouse.y = event.clientY - rect.top;
                    self.render();
                }, false);
                // render mouse state on mouse down
                this._canvas.addEventListener("mousedown", function () {
                    self._mouse.down = true;
                    self.render();
                }, false);
                // render mouse state on mouse up
                this._canvas.addEventListener("mouseup", function () {
                    self._mouse.down = false;
                    self.render();
                }, false);
            }
            /**
             * Start the controller. Will throw an exception if called after already started.
             */
            Controller.prototype.start = function () {
                if (this._started)
                    throw "already started";
                this._started = true;
                this.resizeCanvas();
                this._client.init(this._canvas.width, this._canvas.height);
                this._timestamp = Date.now();
                var self = this;
                window.setInterval(function () { return self.render(); }, 30);
                window.onresize = function () { return self.resizeCanvas(); };
            };
            /**
             * Resize the canvas to the window size
             */
            Controller.prototype.resizeCanvas = function () {
                this._canvas.width = window.innerWidth;
                this._canvas.height = window.innerHeight;
            };
            /**
             * Runs a render loop cycle.
             */
            Controller.prototype.render = function () {
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
            return Controller;
        })();
        FullCanvas.Controller = Controller;
        /**
         * Encapsulates the state of the mouse.
         */
        var MouseState = (function () {
            function MouseState() {
            }
            return MouseState;
        })();
        FullCanvas.MouseState = MouseState;
    })(FullCanvas || (FullCanvas = {}));
    return FullCanvas;
});
//# sourceMappingURL=fullcanvas.js.map