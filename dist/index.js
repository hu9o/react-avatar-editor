(function (global, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['exports', 'module'], factory);
    } else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
        factory(exports, module);
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports, mod);
        global.index = mod.exports;
    }
})(this, function (exports, module) {
    'use strict';

    var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

    var React = require('react');

    var isTouchDevice = !!(typeof window !== 'undefined' && typeof navigator !== 'undefined' && ('ontouchstart' in window || navigator.msMaxTouchPoints > 0));
    var draggableEvents = {
        mobile: {
            react: {
                down: 'onTouchStart',
                drag: 'onTouchMove',
                drop: 'onTouchEnd',
                move: 'onTouchMove',
                up: 'onTouchUp'
            },
            native: {
                down: 'touchstart',
                drag: 'touchmove',
                drop: 'touchend',
                move: 'touchmove',
                up: 'touchup'
            }
        },
        desktop: {
            react: {
                down: 'onMouseDown',
                drag: 'onDragOver',
                drop: 'onDrop',
                move: 'onMouseMove',
                up: 'onMouseUp'
            },
            native: {
                down: 'mousedown',
                drag: 'dragStart',
                drop: 'drop',
                move: 'mousemove',
                up: 'mouseup'
            }
        }
    };
    var deviceEvents = isTouchDevice ? draggableEvents.mobile : draggableEvents.desktop;

    var AvatarEditor = React.createClass({
        displayName: 'AvatarEditor',

        propTypes: {
            scale: React.PropTypes.number,
            image: React.PropTypes.string,
            border: React.PropTypes.number,
            width: React.PropTypes.number,
            height: React.PropTypes.number,
            color: React.PropTypes.arrayOf(React.PropTypes.number),
            rulerColor: React.PropTypes.arrayOf(React.PropTypes.number),
            onImageReady: React.PropTypes.func,
            style: React.PropTypes.object,

            onLoadFailed: React.PropTypes.func,
            onUpload: React.PropTypes.func,
            onImageLoad: React.PropTypes.func
        },

        getDefaultProps: function getDefaultProps() {
            return {
                scale: 1,
                border: 25,
                width: 200,
                height: 200,
                color: [0, 0, 0, 0.5],
                rulerColor: [255, 0, 0, 1],
                style: {},
                onLoadFailed: function onLoadFailed() {},
                onUpload: function onUpload() {},
                onImageLoad: function onImageLoad() {}
            };
        },

        getInitialState: function getInitialState() {
            return {
                drag: false,
                my: null,
                mx: null,
                image: {
                    x: 0,
                    y: 0
                }
            };
        },

        getDimensions: function getDimensions() {
            return {
                width: this.props.width,
                height: this.props.height,
                border: this.props.border,
                canvas: {
                    width: this.props.width + this.props.border * 2,
                    height: this.props.height + this.props.border * 2
                }
            };
        },

        getImage: function getImage(type, quality) {
            var dom = document.createElement('canvas');
            var context = dom.getContext('2d');
            var dimensions = this.getDimensions();
            var border = 0;

            dom.width = dimensions.width;
            dom.height = dimensions.height;

            context.globalCompositeOperation = 'destination-over';

            this.paintImage(context, this.state.image, border);

            return dom.toDataURL(type, quality);
        },

        isDataURL: function isDataURL(str) {
            var regex = /^\s*data:([a-z]+\/[a-z]+(;[a-z\-]+\=[a-z\-]+)?)?(;base64)?,[a-z0-9\!\$\&\'\,\(\)\*\+\,\;\=\-\.\_\~\:\@\/\?\%\s]*\s*$/i;
            return !!str.match(regex);
        },

        loadImage: function loadImage(imageURL) {
            var imageObj = new Image();
            imageObj.onload = this.handleImageReady.bind(this, imageObj);
            imageObj.onerror = this.props.onLoadFailed;
            if (!this.isDataURL(imageURL)) imageObj.crossOrigin = 'anonymous';
            imageObj.src = imageURL;
        },

        componentDidMount: function componentDidMount() {
            var context = React.findDOMNode(this.refs.canvas).getContext('2d');
            if (this.props.image) {
                this.loadImage(this.props.image);
            }
            this.paint(context);
            document && document.addEventListener(deviceEvents.native.move, this.handleMouseMove, false);
            document && document.addEventListener(deviceEvents.native.up, this.handleMouseUp, false);

            if (isTouchDevice) React.initializeTouchEvents(true);
        },

        componentWillUnmount: function componentWillUnmount() {
            document && document.removeEventListener(deviceEvents.native.move, this.handleMouseMove, false);
            document && document.removeEventListener(deviceEvents.native.up, this.handleMouseUp, false);
        },

        componentDidUpdate: function componentDidUpdate() {
            var context = React.findDOMNode(this.refs.canvas).getContext('2d');
            context.clearRect(0, 0, this.getDimensions().canvas.width, this.getDimensions().canvas.height);
            this.paint(context);
            this.paintImage(context, this.state.image, this.props.border);
        },

        handleImageReady: function handleImageReady(image) {
            var imageState = this.getInitialSize(image.width, image.height);
            imageState.resource = image;
            imageState.x = 0;
            imageState.y = 0;
            this.props.onImageLoad(imageState);
            this.setState({ drag: false, image: imageState }, this.props.onImageReady);
        },

        getInitialSize: function getInitialSize(width, height) {
            var newHeight, newWidth, dimensions, canvasRatio, imageRatio;

            dimensions = this.getDimensions();

            canvasRatio = dimensions.height / dimensions.width;
            imageRatio = height / width;

            if (canvasRatio > imageRatio) {
                newHeight = this.getDimensions().height;
                newWidth = width * (newHeight / height);
            } else {
                newWidth = this.getDimensions().width;
                newHeight = height * (newWidth / width);
            }

            return {
                height: newHeight,
                width: newWidth
            };
        },

        componentWillReceiveProps: function componentWillReceiveProps(newProps) {
            if (this.props.image != newProps.image) {
                this.loadImage(newProps.image);
            }
            if (this.props.scale != newProps.scale || this.props.height != newProps.height || this.props.width != newProps.width || this.props.border != newProps.border) {
                this.squeeze(newProps);
            }
        },

        paintImage: function paintImage(context, image, border) {
            if (image.resource) {
                var position = this.calculatePosition(image, border);
                context.save();
                context.globalCompositeOperation = 'destination-over';
                context.drawImage(image.resource, position.x, position.y, position.width, position.height);

                context.restore();
            }
        },

        calculatePosition: function calculatePosition(image, border) {
            image = image || this.state.image;
            var x,
                y,
                width,
                height,
                dimensions = this.getDimensions();
            width = image.width * this.props.scale;
            height = image.height * this.props.scale;

            var widthDiff = (width - dimensions.width) / 2;
            var heightDiff = (height - dimensions.height) / 2;
            x = image.x * this.props.scale - widthDiff + border;
            y = image.y * this.props.scale - heightDiff + border;

            return {
                x: x,
                y: y,
                height: height,
                width: width
            };
        },

        paint: function paint(context) {
            context.save();
            context.translate(0, 0);
            context.fillStyle = "rgba(" + this.props.color.slice(0, 4).join(",") + ")";

            var dimensions = this.getDimensions();

            var borderSize = dimensions.border;
            var height = dimensions.canvas.height;
            var width = dimensions.canvas.width;

            context.fillRect(0, 0, width, borderSize); // top
            context.fillRect(0, height - borderSize, width, borderSize); // bottom
            context.fillRect(0, borderSize, borderSize, height - borderSize * 2); // left
            context.fillRect(width - borderSize, borderSize, borderSize, height - borderSize * 2); // right

            var borderSizeMinusHalfPx = borderSize - 0.5;
            context.beginPath();
            context.strokeStyle = "rgba(" + this.props.rulerColor.slice(0, 4).join(",") + ")";
            context.moveTo(borderSizeMinusHalfPx, 0);context.lineTo(borderSizeMinusHalfPx, height);
            context.moveTo(width - borderSizeMinusHalfPx, 0);context.lineTo(width - borderSizeMinusHalfPx, height);
            context.moveTo(0, borderSizeMinusHalfPx);context.lineTo(width, borderSizeMinusHalfPx);
            context.moveTo(0, height - borderSizeMinusHalfPx);context.lineTo(width, height - borderSizeMinusHalfPx);
            context.stroke();

            context.restore();
        },

        handleMouseDown: function handleMouseDown() {
            this.setState({
                drag: true,
                mx: null,
                my: null
            });
        },
        handleMouseUp: function handleMouseUp() {
            if (this.state.drag) {
                this.setState({ drag: false });
            }
        },

        handleMouseMove: function handleMouseMove(e) {
            if (false == this.state.drag) {
                return;
            }

            var imageState = this.state.image;
            var lastX = imageState.x;
            var lastY = imageState.y;

            var mousePositionX = isTouchDevice ? event.targetTouches[0].pageX : e.clientX;
            var mousePositionY = isTouchDevice ? event.targetTouches[0].pageY : e.clientY;

            var newState = { mx: mousePositionX, my: mousePositionY, image: imageState };

            if (this.state.mx && this.state.my) {
                var xDiff = (this.state.mx - mousePositionX) / this.props.scale;
                var yDiff = (this.state.my - mousePositionY) / this.props.scale;

                imageState.y = this.getBoundedY(lastY - yDiff, this.props.scale);
                imageState.x = this.getBoundedX(lastX - xDiff, this.props.scale);
            }

            this.setState(newState);
        },

        squeeze: function squeeze(props) {
            var imageState = this.state.image;
            imageState.y = this.getBoundedY(imageState.y, props.scale);
            imageState.x = this.getBoundedX(imageState.x, props.scale);
            this.setState({ image: imageState });
        },

        getBoundedX: function getBoundedX(x, scale) {
            var image = this.state.image;
            var dimensions = this.getDimensions();
            var widthDiff = Math.floor((image.width - dimensions.width / scale) / 2);
            widthDiff = Math.max(0, widthDiff);
            return Math.max(-widthDiff, Math.min(x, widthDiff));
        },

        getBoundedY: function getBoundedY(y, scale) {
            var image = this.state.image;
            var dimensions = this.getDimensions();
            var heightDiff = Math.floor((image.height - dimensions.height / scale) / 2);
            heightDiff = Math.max(0, heightDiff);
            return Math.max(-heightDiff, Math.min(y, heightDiff));
        },

        handleDragOver: function handleDragOver(e) {
            e.preventDefault();
        },

        handleSelectFile: function handleSelectFile(e) {
            var _this = this;

            e.stopPropagation();
            e.preventDefault();
            var reader = new FileReader();
            var file = e.target.files[0];
            reader.onload = function (e) {
                return _this.loadImage(e.target.result);
            };
            reader.readAsDataURL(file);
        },

        handleDrop: function handleDrop(e) {
            var _this2 = this;

            e.stopPropagation();
            e.preventDefault();
            var reader = new FileReader();
            var file = e.dataTransfer.files[0];
            reader.onload = function (e) {
                return _this2.loadImage(e.target.result);
            };
            reader.readAsDataURL(file);
        },

        render: function render() {
            var defaultStyle = {
                cursor: this.state.drag ? 'grabbing' : 'grab'
            };

            var attributes = {
                width: this.getDimensions().canvas.width,
                height: this.getDimensions().canvas.height,
                style: Object.assign(defaultStyle, this.props.style)
            };

            attributes[deviceEvents.react.down] = this.handleMouseDown;
            attributes[deviceEvents.react.drag] = this.handleDragOver;
            attributes[deviceEvents.react.drop] = this.handleDrop;

            return React.createElement(
                'div',
                { style: { display: 'inline-block' } },
                React.createElement('canvas', _extends({ ref: 'canvas' }, attributes)),
                React.createElement('br', null),
                React.createElement('input', { type: 'file', onChange: this.handleSelectFile })
            );
        }
    });

    module.exports = AvatarEditor;
});
