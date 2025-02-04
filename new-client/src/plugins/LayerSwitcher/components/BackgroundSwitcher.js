import React from "react";
import { withStyles } from "@material-ui/core/styles";
import propTypes from "prop-types";
import { isValidLayerId } from "utils/Validator";
import Radio from "@material-ui/core/Radio";
import RadioButtonUncheckedIcon from "@material-ui/icons/RadioButtonUnchecked";
import RadioButtonCheckedIcon from "@material-ui/icons/RadioButtonChecked";
import OSM from "ol/source/OSM";
import TileLayer from "ol/layer/Tile";

const WHITE_BACKROUND_LAYER_ID = "-1";
const BLACK_BACKROUND_LAYER_ID = "-2";
const OSM_BACKGROUND_LAYER_ID = "-3";

const SPECIAL_BACKGROUND_COLORS = {
  [WHITE_BACKROUND_LAYER_ID]: "#fff",
  [BLACK_BACKROUND_LAYER_ID]: "#000",
};

const styles = (theme) => ({
  layerItemContainer: {
    borderBottom: `${theme.spacing(0.2)}px solid ${theme.palette.divider}`,
  },
  captionText: {
    position: "relative",
    top: "2px",
    fontSize: theme.typography.pxToRem(15),
  },
});

class BackgroundSwitcher extends React.PureComponent {
  state = {
    selectedLayerId: -1, // By default, select special case "white background"
  };

  osmLayer = undefined;

  static propTypes = {
    backgroundSwitcherBlack: propTypes.bool.isRequired,
    backgroundSwitcherWhite: propTypes.bool.isRequired,
    enableOSM: propTypes.bool.isRequired,
    classes: propTypes.object.isRequired,
    display: propTypes.bool.isRequired,
    layerMap: propTypes.object.isRequired,
    layers: propTypes.array.isRequired,
  };

  /**
   * @summary If there's a Background layer that is visible from start, make sure that proper radio button is selected in Background Switcher.
   * @memberof BackgroundSwitcher
   */
  componentDidMount() {
    const backgroundVisibleFromStart = this.props.layers.find(
      (layer) => layer.visible
    );
    backgroundVisibleFromStart &&
      this.setState({
        selectedLayerId: backgroundVisibleFromStart.name,
      });

    if (this.props.enableOSM) {
      // Initiate our special case layer, OpenStreetMap
      const osmSource = new OSM({
        reprojectionErrorThreshold: 5,
      });
      this.osmLayer = new TileLayer({
        visible: false,
        source: osmSource,
        zIndex: -1,
      });
      this.props.map.addLayer(this.osmLayer);
    }

    // Ensure that BackgroundSwitcher correctly selects visible layer,
    // by listening to a event that each layer will send when its visibility
    // changes.
    this.props.app.globalObserver.subscribe(
      "core.layerVisibilityChanged",
      ({ target: layer }) => {
        const name = layer.get("name");

        // Early return if layer who's visibility was changed couldn't
        // be found among the background layers, or if the visibility
        // was changed to 'false'.
        if (
          this.props.layers.findIndex((l) => name === l.name) === -1 ||
          layer.get("visible") === false
        ) {
          return;
        }

        // If we got this far, we have a background layer that just
        // became visible. Let's notify the radio buttons by setting state!
        this.setState({
          selectedLayerId: layer.get("name"),
        });
      }
    );
  }

  isSpecialBackgroundLayer = (id) => {
    return [
      WHITE_BACKROUND_LAYER_ID,
      BLACK_BACKROUND_LAYER_ID,
      OSM_BACKGROUND_LAYER_ID,
    ].includes(id);
  };

  setSpecialBackground = (id) => {
    document.getElementById("map").style.backgroundColor =
      SPECIAL_BACKGROUND_COLORS[id];
  };

  /**
   * @summary Hides previously selected background and shows current selection.
   * @param {Object} e The event object, contains target's value
   */
  onChange = (e) => {
    const newSelectedId = e.target.value;
    const { selectedLayerId } = this.state;
    const { layerMap } = this.props;

    this.isSpecialBackgroundLayer(newSelectedId)
      ? this.setSpecialBackground(newSelectedId)
      : layerMap[newSelectedId].setVisible(true);

    !this.isSpecialBackgroundLayer(selectedLayerId) &&
      layerMap[selectedLayerId].setVisible(false);
    this.osmLayer &&
      this.osmLayer.setVisible(newSelectedId === OSM_BACKGROUND_LAYER_ID);

    this.setState({
      selectedLayerId: newSelectedId,
    });
  };

  /**
   * @summary Returns a <div> that contains a {React.Component} consisting of one Radio button.
   *
   * @param {Object} config Base layer to be rendered
   * @param {Number} index Unique key
   * @returns {React.Component}
   * @memberof BackgroundSwitcher
   */
  renderRadioButton(config, index) {
    let caption;
    let checked = this.state.selectedLayerId === config.name;

    const mapLayer = this.props.layerMap[config.name];
    const { classes } = this.props;

    if (mapLayer) {
      caption = mapLayer.get("layerInfo").caption;
    } else {
      caption = config.caption;
    }

    return (
      <div key={index} className={classes.layerItemContainer}>
        <Radio
          id={caption + "_" + index}
          checked={checked}
          onChange={this.onChange}
          value={config.name || config}
          color="default"
          name="backgroundLayer"
          icon={<RadioButtonUncheckedIcon fontSize="small" />}
          checkedIcon={<RadioButtonCheckedIcon fontSize="small" />}
        />
        <label htmlFor={caption + "_" + index} className={classes.captionText}>
          {caption}
        </label>
      </div>
    );
  }

  /**
   * Prepares an array of radio buttons with the configured base layers.
   *
   * @returns {React.Component[]} radioButtons Array of ready to use DOM components of Radio buttons
   * @memberof BackgroundSwitcher
   */
  renderBaseLayerComponents() {
    const { backgroundSwitcherWhite, backgroundSwitcherBlack, enableOSM } =
      this.props;
    let radioButtons = [],
      defaults = [];

    /**
     * If admin wants to display white/black options for background, let's
     * call renderRadioButton() for those two special cases. The resulting
     * Component will be pushed into an array called @param defaults.
     */
    if (backgroundSwitcherWhite) {
      defaults.push(
        this.renderRadioButton(
          {
            name: "-1",
            caption: "Vit",
          },
          -1
        )
      );
    }
    if (backgroundSwitcherBlack) {
      defaults.push(
        this.renderRadioButton(
          {
            name: "-2",
            caption: "Svart",
          },
          -2
        )
      );
    }

    enableOSM &&
      defaults.push(
        this.renderRadioButton({ name: "-3", caption: "OpenStreetMap" }, -3)
      );

    /**
     * Let's construct the final array of radio buttons. It will consists
     * of the defaults from above, plus the result of calling renderRadioButton()
     * for each base layer.
     */
    radioButtons = [
      ...defaults,
      ...this.props.layers
        .filter((layer) => {
          //Remove layers not having a valid id
          const validLayerId = isValidLayerId(layer.name);
          if (!validLayerId) {
            console.warn(
              `Backgroundlayer with id ${layer.name} has a non-valid id`
            );
          }
          return validLayerId;
        })
        .map((layerConfig, i) => this.renderRadioButton(layerConfig, i)),
    ];

    return radioButtons;
  }

  render() {
    return (
      <div style={{ display: this.props.display ? "block" : "none" }}>
        {this.renderBaseLayerComponents()}
      </div>
    );
  }
}

export default withStyles(styles)(BackgroundSwitcher);
