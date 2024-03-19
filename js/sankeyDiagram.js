class SankeyDiagram {

  /**
   * Class constructor with initial configuration
   * @param {Object}
   */
  // Todo: Add or remove parameters from the constructor as needed
  constructor(_config, data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 240,
      containerHeight: 260,
      margin: {
        top: 30,
        right: 5,
        bottom: 20,
        left: 30
      }
      // Todo: Add or remove attributes from config as needed
    }
    this.initVis();
  }

  initVis() {
    let vis = this;
    // Todo: Create SVG area, initialize scales and axes
  }

  updateVis() {
    let vis = this;
    // Todo: Prepare data and scales
  }

  renderVis() {
    let vis = this;
    // Todo: Bind data to visual elements, update axes
  }
}