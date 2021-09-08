import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";

class FirSearchResultItemView extends React.PureComponent {
  state = {};

  static propTypes = {
    model: PropTypes.object.isRequired,
    app: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
  };

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;
  }

  render() {
    const { classes } = this.props;

    let data = {
      list: [
        { key: "realestate", title: "Fastighet", value: "TESTÄPPLET X" },
        { key: "area", title: "Område", value: "1" },
        { key: "owner1", title: "Ägare", value: "Andersson, Greta Gunhild" },
        { key: "owner2", title: "Ägare", value: "Andersson, Nisse Greger" },
        { key: "owner3", title: "Ägare", value: "" },
        { key: "note_owner", title: "Notering ägare", value: "" },
        {
          key: "address",
          title: "Fastighetsadress",
          value: "Nissevägen 33, 432 XX Varberg",
        },
        {
          key: "total_area",
          title: "Registrerad totalarea (m2)",
          value: "800",
        },
      ],
      urls: [
        {
          key: "report_simple",
          title: "Fastighetsrapport (förenklad)",
          url:
            "https://fastighetsrapport-utv.varberg.se/Report/Fastighetenkel/pdf/xxxxxxxxxx",
          target: "_blank",
        },
        {
          key: "report_full",
          title: "Fastighetsrapport (komplett)",
          url:
            "https://fastighetsrapport-utv.varberg.se/Report/Fastighet/pdf/xxxxxxxxxxx",
          target: "_blank",
        },
        {
          key: "building_permit",
          title: "Bygglovsanteckning",
          url:
            "https://bygglovsanteckning-utv.varberg.se/?fnr=xxxxxxxxxxxx&fastighet=xxxxxxxxxxxx",
          target: "_blank",
        },
      ],
    };

    return (
      <>
        <div className={classes.root}>
          <table className={classes.resultItemTable}>
            <tbody>
              {data.list.map((item, index) => {
                return (
                  <tr key={"row" + index}>
                    <td>{item.title}</td>
                    <td>{item.value || "\u00A0"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className={classes.urlList}>
            {data.urls.map((link, index) => {
              return (
                <div key={"url" + index}>
                  <a
                    href={link.url}
                    target={link.target || "_ blank"}
                    title={link.title}
                  >
                    {link.title}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  }
}

const styles = (theme) => ({
  root: {},
  resultItemTable: {
    borderSpacing: 0,
    width: "100%",
    marginBottom: theme.spacing(2),
    "& tr:nth-child(even) td": {
      backgroundColor: theme.palette.type === "dark" ? "#565656" : "#e8e8e8",
    },
    "& tr td:first-child": {
      fontWeight: 500,
    },
    "& td": {
      verticalAlign: "top",
      padding: "2px 6px",
    },
  },
  urlList: {
    "& a": {
      display: "block",
      padding: "2px 0",
    },
  },
});

export default withStyles(styles)(withSnackbar(FirSearchResultItemView));
