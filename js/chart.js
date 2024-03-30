class Chart {
    locked = false;

    constructor(_config, data, dispatch) {
		this.config = {
			parentElement: _config.parentElement,
			containerWidth: _config.width,
			containerHeight: _config.height,
			marginTop: _config.margin.top,
			marginRight: _config.margin.right,
			marginBottom: _config.margin.bottom,
			marginLeft: _config.margin.left,
			margin: {}
		}
		this.ogData = data;
		this.dispatch = dispatch;
		this.emphasized = [];
    }

    isLocked() {
        return this.locked;
    }
}