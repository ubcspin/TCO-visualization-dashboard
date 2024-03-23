class Chart {
    locked = false;

    constructor(_config, data) {
		this.config = {
			parentElement: _config.parentElement,
			containerWidth: _config.width,
			containerHeight: _config.height,
			margin: {
				top: _config.margin.top,
				right: _config.margin.right,
				bottom: _config.margin.bottom,
				left: _config.margin.left
			}
		}
		this.ogData = data;
    }

    isLocked() {
        return this.locked;
    }
}