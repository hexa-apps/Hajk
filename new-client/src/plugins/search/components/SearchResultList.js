import React from "react";
import { withStyles } from "@material-ui/core/styles";
import SearchResultGroup from "./SearchResultGroup.js";
import IconButton from "@material-ui/core/IconButton";
import AddCircleIcon from "@material-ui/icons/AddCircle";
import RemoveCircleIcon from "@material-ui/icons/RemoveCircle";
import classNames from "classnames";

const styles = theme => {
  return {
    searchResultEmpty: {
      padding: "10px"
    },
    searchResult: {
      position: "static",
      maxHeight: "inherit",
      maxWidth: "inherit",
      border: "none",
      padding: 0,
      [theme.breakpoints.up("lg")]: {
        position: "absolute",
        background: "white",
        color: "black",
        width: "100%",
        maxWidth: "350px",
        overflow: "auto",
        padding: "10px",
        border: "1px solid #ccc",
        borderTop: "none",
        marginTop: "11px",
        right: "10px"
      }
    },
    searchResultContainer: {
      maxHeight: "500px",
      overflow: "auto",
      [theme.breakpoints.down("md")]: {
        maxHeight: "inherit"
      }
    },
    searchResultTopBar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      margin: "5px"
    },
    visible: {
      display: "block"
    },
    hidden: {
      display: "none"
    }
  };
};

class SearchResultList extends React.PureComponent {
  state = {
    visible: true,
    minimized: false
  };

  hide() {
    this.setState({
      minimized: true
    });
  }

  toggle() {
    this.setState({
      minimized: !this.state.minimized
    });
  }

  renderResult() {
    const { result } = this.props;
    if (this.state.minimized) return null;
    return (
      <div>
        {result.map((featureType, i) => {
          if (featureType.features.length === 0) return null;
          return (
            <SearchResultGroup
              parent={this}
              key={i}
              featureType={featureType}
              model={this.props.model}
              expanded={false}
            />
          );
        })}
      </div>
    );
  }

  render() {
    const { classes, result } = this.props;
    const { minimized } = this.state;
    if (result.every(r => r.features.length === 0)) {
      return (
        <div className={classes.searchResult}>
          <div className={classes.searchResultEmpty}>
            Sökningen gav inget resultat
          </div>
        </div>
      );
    }

    if (!this.state.visible) {
      return null;
    } else {
      return (
        <div className={classes.searchResult}>
          <div className={classes.searchResultTopBar}>
            <div>SÖKRESULTAT</div>
            <div>
              {!minimized ? (
                <IconButton
                  className={classes.button}
                  onClick={() => this.toggle()}
                >
                  <RemoveCircleIcon />
                </IconButton>
              ) : (
                <IconButton
                  className={classes.button}
                  onClick={() => this.toggle()}
                >
                  <AddCircleIcon />
                </IconButton>
              )}
            </div>
          </div>
          <div
            className={classNames(
              classes.searchResultContainer,
              this.state.minimized ? classes.hidden : classes.visible
            )}
          >
            {result.map((featureType, i) => {
              if (featureType.features.length === 0) return null;
              return (
                <SearchResultGroup
                  parent={this}
                  key={i}
                  featureType={featureType}
                  model={this.props.model}
                  expanded={false}
                />
              );
            })}
          </div>
        </div>
      );
    }
  }
}

export default withStyles(styles)(SearchResultList);
