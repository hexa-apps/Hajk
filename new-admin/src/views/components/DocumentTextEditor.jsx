import React from "react";
import {
  EditorState,
  RichUtils,
  Modifier,
  AtomicBlockUtils,
  getDefaultKeyBinding,
  KeyBindingUtil,
  convertToRaw,
  SelectionState,
} from "draft-js";
import Editor from "draft-js-plugins-editor";
import { stateToHTML } from "draft-js-export-html";
import DraftOffsetKey from "draft-js/lib/DraftOffsetKey";
import { stateFromHTML } from "draft-js-import-html";
import { withStyles } from "@material-ui/core/styles";
import FormatBoldIcon from "@material-ui/icons/FormatBold";
import FormatItalicIcon from "@material-ui/icons/FormatItalic";
import FormatUnderlinedIcon from "@material-ui/icons/FormatUnderlined";
import FormatListBulletedIcon from "@material-ui/icons/FormatListBulleted";
import FormatListNumberedIcon from "@material-ui/icons/FormatListNumbered";
import FormatQuoteIcon from "@material-ui/icons/FormatQuote";
import ImageIcon from "@material-ui/icons/Image";
import DescriptionIcon from "@material-ui/icons/Description";
import MapIcon from "@material-ui/icons/Map";
import LaunchIcon from "@material-ui/icons/Launch";
import Grid from "@material-ui/core/Grid";
import TextField from "@material-ui/core/TextField";
import Autocomplete from "@material-ui/lab/Autocomplete";
import { red, green } from "@material-ui/core/colors";
import TextAreaInput from "./TextAreaInput";
import addLinkPlugin from "./addLinkPlugin";
import StyleButton from "./StyleButton";
import ImageComponent from "./ImageComponent";
import insertNewLine from "../utils/insertNewLine";
import { Typography, Button } from "@material-ui/core";

const ColorButtonRed = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(red[500]),
    backgroundColor: red[500],
    "&:hover": {
      backgroundColor: red[700],
    },
  },
}))(Button);

const ColorButtonGreen = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(green[700]),
    backgroundColor: green[500],
    "&:hover": {
      backgroundColor: green[700],
    },
  },
}))(Button);

export default class DocumentTextEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editorState: EditorState.createWithContent(
        this._stateFromHtmlWithOptions(this.props.html)
      ),
      html: this.props.html,
      showURLInput: false,
      showLinkInput: false,
      showTextAreaInput: false,
      url: "",
      urlType: "",
      imageList: this.props.imageList,
      documents: this.props.documents,
      readOnly: false,
      onReadOnly: false,
      currentImage: "",
      imageData: {},
      urlValue: "",
      imageAlt: "",
      defaultWidth: null,
      defaultHeight: null,
    };
    this.plugins = [addLinkPlugin];
    this.focus = () => this.refs.editor.focus();
    this.logState = () => {
      const content = this.state.editorState.getCurrentContent();
      console.log("HTML", this.props.html);
      console.log(stateToHTML(content));
      console.log(convertToRaw(content));
    };
    this.onChange = this._onChange.bind(this);
    this.onURLChange = (e) => this.setState({ urlValue: e.target.value });
    this.onImageAltChange = (e) => this.setState({ imageAlt: e.target.value });
    this.onTitleChange = (e) => this.setState({ urlTitle: e.target.value });
    this.onTitleIdChange = (e) => this.setState({ urlTitleId: e.target.value });
    this.onDataCaptionChange = (e) =>
      this.setState({ mediaCaption: e.target.value });
    this.onDataSourceChange = (e) =>
      this.setState({ mediaSource: e.target.value });
    this.onDataPopupChange = (e) =>
      this.setState({ mediaPopup: !this.state.mediaPopup });
    this.onDataPositionChange = (e) =>
      this.setState({ mediaPosition: e.target.value });
    this.onBlockBackgroundChange = (e) =>
      this.setState({ blockBackground: e.target.value });
    this.onBlockDividerChange = (e) =>
      this.setState({ blockDivider: e.target.value });
    this.addAudio = this._addAudio.bind(this);
    this.addImage = this._addImage.bind(this);
    this.addVideo = this._addVideo.bind(this);
    this.addMapLink = this._addMapLink.bind(this);
    this.addDocumentLink = this._addDocumentLink.bind(this);
    this.addWebLink = this._addWebLink.bind(this);
    this.addTextArea = this._addTextArea.bind(this);
    this.closeURLInput = this._closeURLInput.bind(this);
    this.closeLinkInput = this._closeLinkInput.bind(this);
    this.confirmMedia = this._confirmMedia.bind(this);
    this.confirmLink = this._confirmLink.bind(this);
    this.handleKeyCommand = this._handleKeyCommand.bind(this);
    this.handlePastedText = this._handlePastedText.bind(this);
    this.handleReturn = this._handleReturn.bind(this);
    this.mapKeyToEditorCommand = this._mapKeyToEditorCommand.bind(this);
    this.onURLInputKeyDown = this._onURLInputKeyDown.bind(this);
    this.onLinkInputKeyDown = this._onLinkInputKeyDown.bind(this);
    this.toggleBlockType = this._toggleBlockType.bind(this);
    this.toggleInlineStyle = this._toggleInlineStyle.bind(this);
    this.blockRenderer = this._blockRenderer.bind(this);
    this.onImgLoad = this.onImgLoad.bind(this);
  }

  _stateFromHtmlWithOptions = (html) => {
    const customBlockFn = (element) => {
      let { tagName } = element;
      if (tagName === "BLOCKQUOTE") {
        return {
          type: "blockquote",
          data: {
            dividerColor:
              element.attributes.getNamedItem("data-divider-color")?.value,
            backgroundColor: element.attributes.getNamedItem(
              "data-background-color"
            )?.value,
            textSection:
              element.attributes.getNamedItem("data-text-section")?.value || "",
          },
        };
      }
    };
    return stateFromHTML(html, { customBlockFn });
  };
  _onChange(editorState) {
    this.setState({ editorState });
    this.applyChanges();
  }
  _handleKeyCommand(command, editorState) {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.onChange(newState);
      return "handled";
    }
    return "not-handled";
  }
  _toggleBlockType(blockType) {
    this.onChange(RichUtils.toggleBlockType(this.state.editorState, blockType));
  }
  _toggleInlineStyle(inlineStyle) {
    this.onChange(
      RichUtils.toggleInlineStyle(this.state.editorState, inlineStyle)
    );
  }
  _confirmMedia(e) {
    e.preventDefault();
    const {
      editorState,
      urlValue,
      imageAlt,
      urlType,
      mediaWidth,
      mediaHeight,
      mediaCaption,
      mediaSource,
      mediaPopup,
      mediaPosition,
    } = this.state;
    const contentState = editorState.getCurrentContent();
    let contentStateWithEntity;

    if (mediaPopup) {
      contentStateWithEntity = contentState.createEntity(urlType, "IMMUTABLE", {
        src: urlValue,
        alt: imageAlt ? imageAlt : "",
        "data-image-width": mediaWidth ? mediaWidth + "px" : null,
        "data-image-height": mediaHeight ? mediaHeight + "px" : null,
        "data-caption": mediaCaption,
        "data-source": mediaSource,
        "data-image-popup": "",
        "data-image-position": mediaPosition,
      });
    } else {
      contentStateWithEntity = contentState.createEntity(urlType, "IMMUTABLE", {
        src: urlValue,
        alt: imageAlt ? imageAlt : "",
        "data-image-width": mediaWidth ? mediaWidth + "px" : null,
        "data-image-height": mediaHeight ? mediaHeight + "px" : null,
        "data-caption": mediaCaption,
        "data-source": mediaSource,
        "data-image-position": mediaPosition,
      });
    }

    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const newEditorState = EditorState.push(
      editorState,
      contentStateWithEntity,
      "create-entity"
    );
    this.setState(
      {
        editorState: AtomicBlockUtils.insertAtomicBlock(
          newEditorState,
          entityKey,
          " "
        ),
        showURLInput: false,
        showLinkInput: false,
        showTextAreaInput: false,
        urlValue: "",
        imageAlt: "",
        mediaWidth: "",
        mediaHeight: "",
        mediaCaption: "",
        mediaSource: "",
        mediaPopup: false,
      },
      () => {
        setTimeout(() => this.focus(), 0);
      }
    );
  }
  _onURLInputKeyDown(e) {
    if (e.which === 13) {
      this._confirmMedia(e);
    }
  }
  _closeURLInput() {
    this.setState(
      {
        showURLInput: false,
        showLinkInput: false,
        showTextAreaInput: false,
        urlValue: "",
        imageAlt: "",
        mediaWidth: "",
        mediaHeight: "",
        mediaCaption: "",
        mediaSource: "",
        mediaPopup: false,
      },
      () => {
        setTimeout(() => this.focus(), 0);
      }
    );
  }

  _confirmLink(e) {
    e.preventDefault();
    const { editorState, urlValue, imageAlt, urlType, urlTitle, urlTitleId } =
      this.state;
    const data = {
      url: urlValue,
      alt: imageAlt,
      type: urlType,
    };

    if (urlType === "urllink") {
      data["data-link"] = urlValue;
    } else if (urlType === "documentlink") {
      data["data-header-identifier"] = urlTitleId;
      data["data-document"] = urlValue;
    } else if (urlType === "maplink") {
      data["data-maplink"] = urlValue;
    }

    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity(
      "LINK",
      "MUTABLE",
      data
    );
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const newEditorState = EditorState.set(editorState, {
      currentContent: contentStateWithEntity,
    });
    this.setState(
      {
        editorState: RichUtils.toggleLink(
          newEditorState,
          newEditorState.getSelection(),
          entityKey,
          urlTitle
        ),
        showURLInput: false,
        showLinkInput: false,
        showTextAreaInput: false,
        urlValue: "",
        imageAlt: "",
        urlTitle: "",
        urlTitleId: "",
      },
      () => {
        setTimeout(() => this.focus(), 0);
      }
    );
    return "handled";
  }
  _onLinkInputKeyDown(e) {
    if (e.which === 13) {
      this._confirmLink(e);
    }
  }
  _closeLinkInput() {
    this.setState(
      {
        showLinkInput: false,
        urlValue: "",
        imageAlt: "",
        urlTitle: "",
        urlTitleId: "",
      },
      () => {
        setTimeout(() => this.focus(), 0);
      }
    );
  }
  _handleReturn = (evt, editorState) => {
    // Handle soft break on Shift+Enter
    const blockType = RichUtils.getCurrentBlockType(this.state.editorState);

    if (evt.shiftKey) {
      this.setState({
        editorState: RichUtils.insertSoftNewline(this.state.editorState),
      });
      return "handled";
    }
    if (this.isImageBlockInSelection(editorState)) {
      this.setState({
        editorState: insertNewLine(editorState),
      });
      return "handled";
    }
    if (blockType !== "blockquote" || !KeyBindingUtil.isSoftNewlineEvent(evt)) {
      return "not_handled";
    }
  };
  _promptForTextArea() {
    this.setState({
      showURLInput: false,
      showLinkInput: false,
      showTextAreaInput: true,
    });
  }
  _promptForMedia(type) {
    this.setState(
      {
        showURLInput: true,
        showLinkInput: false,
        showTextAreaInput: false,
        urlValue: this.state.urlValue,
        imageAlt: this.state.imageAlt,
        urlType: type,
        mediaWidth: this.state.mediaWidth,
        mediaHeight: this.state.mediaHeight,
        mediaCaption: this.state.mediaCaption,
        mediaSource: this.state.mediaSource,
        mediaPopup: this.state.mediaPopup,
      },
      () => {
        setTimeout(() => this.refs.url.focus(), 0);
      }
    );
  }
  _promptForLink(type) {
    this.setState(
      {
        showURLInput: false,
        showLinkInput: true,
        showTextAreaInput: false,
        urlValue: this.state.urlValue,
        imageAlt: this.state.imageAlt,
        urlType: type,
        urlTitle: "",
        urlTitleId: "",
      },
      () => {
        setTimeout(() => this.refs.link.focus(), 0);
      }
    );
  }

  _addTextArea() {
    this._promptForTextArea();
  }

  _addAudio() {
    this._promptForMedia("audio");
  }
  _addImage() {
    this._promptForMedia("image");
  }
  _addVideo() {
    this._promptForMedia("video");
  }
  _addMapLink() {
    this._promptForLink("maplink");
  }
  _addDocumentLink() {
    this._promptForLink("documentlink");
  }
  _addWebLink() {
    this._promptForLink("urllink");
  }

  _mapKeyToEditorCommand(e) {
    if (e.keyCode === 9 /* TAB */) {
      const newEditorState = RichUtils.onTab(
        e,
        this.state.editorState,
        4 /* maxDepth */
      );
      if (newEditorState !== this.state.editorState) {
        this.onChange(newEditorState);
      }
      return;
    }
    return getDefaultKeyBinding(e);
  }
  _handlePastedText = (text = "", html) => {
    // If clipboard contains unformatted text, the first parameter
    // is used, while the second is empty. In the code below, we
    // only take care for the second parameter. So to handle
    // those cases where unformatted text is pasted in, we must
    // ensure that the second paramter always is defined.
    // That can be done by copying the contents of the first parameter
    // if the second parameter is empty/undefined.
    if (html?.trim().length === 0 || html === undefined) {
      html = text;
    }
    const { editorState } = this.state;
    const generatedState = this._stateFromHtmlWithOptions(html);
    const generatedHtml = stateToHTML(generatedState);
    const el = document.createElement("div");
    el.innerHTML = generatedHtml;

    const images = el.getElementsByTagName("img");

    for (let i = 0; i < images.length; i++) {
      let img = images[i];
      img.src = img.alt;
      img.alt = "";
      img.width = "";
      img.height = "";
      img["data-image-width"] = "";
      img["data-image-height"] = "";
      img["data-caption"] = "";
      img["data-source"] = "";
      img["data-image-position"] = "";
      let figure = document.createElement("figure");
      figure.innerHTML = img.outerHTML;
      img.parentNode.replaceChild(figure, img);
    }

    if (el.lastChild.getElementsByTagName("figure").length > 0) {
      let p = document.createElement("p");
      p.innerHTML = "&nbsp;";
      el.appendChild(p);
    }

    const blockMap = this._stateFromHtmlWithOptions(el.outerHTML).blockMap;
    const newState = Modifier.replaceWithFragment(
      editorState.getCurrentContent(),
      editorState.getSelection(),
      blockMap
    );
    this.onChange(EditorState.push(editorState, newState, "insert-fragment"));

    return true;
  };
  _blockRenderer(block, { getEditorState }) {
    let blockType = block.getType();
    const { editorState } = this.state;
    const contentState = getEditorState().getCurrentContent();

    if (blockType === "atomic") {
      const entityKey = contentState.getEntity(block.getEntityAt(0));
      const type = entityKey.getType().toLowerCase();

      if (type === "image") {
        const selection = editorState.getSelection();

        const contentBlockKey = block.getKey();

        return {
          component: ImageComponent,
          editable: false,
          props: {
            readOnlyMode: this.toggleReadOnly,
            currentImage: (img) => this.setState({ currentImage: img }),
            imageData: (data) =>
              this.updateSelectedImageData(contentBlockKey, editorState, data),
            isFocused: () =>
              selection.getAnchorKey() === contentBlockKey &&
              this.isImageBlockInSelection(editorState),
            onClick: () =>
              EditorState.push(
                this.selectImageWithBlockKey(editorState, contentBlockKey)
              ),
          },
        };
      }
    }
    return null;
  }

  selectImageWithBlockKey(editorState, key) {
    const offsetKey = DraftOffsetKey.encode(key, 0, 0);
    const node = document.querySelectorAll(
      `[data-offset-key="${offsetKey}"]`
    )[0];
    if (node) {
      const nativeSelection = window.getSelection();
      const range = document.createRange();
      range.setStart(node, 0);
      range.setEnd(node, 0);
      nativeSelection.removeAllRanges();
      nativeSelection.addRange(range);
    }

    const selection = editorState.getSelection();
    const sel = selection.merge({
      anchorKey: key,
      anchorOffset: 0,
      focusKey: key,
      focusOffset: 0,
    });
    return EditorState.forceSelection(editorState, sel);
  }

  updateSelectedImageData(anchorKey, editorState, data) {
    let selection = this.state.editorState.getSelection();

    const updateSelection = new SelectionState({
      anchorKey: anchorKey,
      anchorOffset: selection.anchorOffset,
      focusKey: anchorKey,
      focusOffset: selection.focusOffset,
      isBackward: false,
    });
    let newEditorState = EditorState.acceptSelection(
      editorState,
      updateSelection
    );

    this.setState({
      editorState: newEditorState,
    });

    let newSelection = newEditorState.getSelection();

    if (anchorKey !== newSelection.getFocusKey()) {
      return editorState;
    }

    const contentState = editorState.getCurrentContent();
    const contentBlock = contentState.getBlockForKey(anchorKey);

    if (contentBlock && contentBlock.getType().toLowerCase() === "atomic") {
      const entityKey = contentBlock.getEntityAt(0);
      const entity = contentState.getEntity(entityKey);

      if (entity && entity.getType().toUpperCase() === "IMAGE") {
        const newContentState = contentState.replaceEntityData(entityKey, data);
        return EditorState.push(editorState, newContentState, "apply-entity");
      }
    }
    return editorState;
  }

  getHtml() {
    const contentState = this.state.editorState.getCurrentContent();

    const blockStyleFn = (block) => {
      const blockType = block.getType().toLowerCase();
      if (blockType === "blockquote") {
        return {
          attributes: {
            "data-divider-color": block.getData().get("dividerColor"),
            "data-background-color": block.getData().get("backgroundColor"),
            "data-text-section": block.getData().get("textSection"),
          },
        };
      }
    };

    const entityStyleFn = (entity) => {
      const entityType = entity.getType().toUpperCase();
      if (entityType === "LINK") {
        // Add styling here
      }
      if (entityType === "IMAGE") {
        // Add styling here
      }
    };

    const options = {
      blockStyleFn,
      entityStyleFn,
    };
    return stateToHTML(contentState, options);
  }

  applyChanges() {
    var htmlString = this.getHtml().replace(/<p><br><\/p>/gm, "");
    this.props.onUpdate(htmlString);
    this.setState({
      html: htmlString,
    });
  }

  getUrlType(type) {
    switch (type) {
      case "urllink":
        return "webblänk";
      case "documentlink":
        return "dokumentlänk";
      case "maplink":
        return "kartlänk";
      default:
        return "länk";
    }
  }

  getUrlInput(type, documents) {
    // Return input field for default URL or documents
    if (type === "documentlink") {
      return (
        <select onChange={this.onURLChange} ref="link">
          {documents
            ? documents.map((document, i) => {
                return (
                  <option key={i} type="text" name="document" value={document}>
                    {document}
                  </option>
                );
              })
            : null}
        </select>
      );
    } else {
      return (
        <input
          onChange={this.onURLChange}
          ref="link"
          style={styles.urlInput}
          type="text"
          value={this.state.urlValue || ""}
          placeholder={this.getUrlType(type)}
          onKeyDown={this.onLinkInputKeyDown}
        />
      );
    }
  }

  getUrlId(type) {
    // Return input field for default URL or documents
    if (type === "documentlink") {
      return (
        <TextField
          autoFocus
          style={styles.urlInput}
          value={this.state.urlTitleId || ""}
          placeholder="data-header-identifier"
          onKeyDown={this.onLinkInputKeyDown}
          helperText="Id-nummer för kapitlet som ska visas"
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
          type="text"
          onChange={this.onTitleIdChange}
          ref="url"
        />
      );
    }
  }

  isImageBlock(contentBlock, contentState) {
    if (contentBlock && contentBlock.getType() === "atomic") {
      const entityKey = contentBlock.getEntityAt(0);
      const entity = contentState.getEntity(entityKey);

      if (entity.getType().toUpperCase() === "IMAGE") {
        return entity && entity.getType().toUpperCase() === "IMAGE";
      }
    }
    return false;
  }

  isImageBlockInSelection(editorState) {
    const selection = editorState.getSelection();
    if (selection.getAnchorKey() !== selection.getFocusKey()) {
      return false;
    }
    const contentState = editorState.getCurrentContent();
    const contentBlock = contentState.getBlockForKey(selection.getAnchorKey());

    return this.isImageBlock(contentBlock, contentState);
  }

  toggleReadOnly = (e) => {
    const { onReadOnly } = this.state;
    this.setState({
      onReadOnly: !onReadOnly,
    });
  };

  handleEditorClick = () => {
    var { readOnly } = this.state;
    if (document.getElementById("edit-image-modal")) {
      readOnly = true;
    } else {
      readOnly = false;
    }
    this.setState({
      readOnly: readOnly,
    });
  };

  onImgLoad({ target: img }) {
    this.setState({
      defaultWidth: img.offsetWidth,
      defaultHeight: img.offsetHeight,
      mediaWidth: img.offsetWidth,
      mediaHeight: img.offsetHeight,
    });
  }

  calculateHeight = (width) => {
    let aspectRatio = this.state.defaultHeight / this.state.defaultWidth;
    let height = width * aspectRatio;

    this.setState({
      mediaWidth: Math.trunc(width),
      mediaHeight: Math.trunc(height),
    });
  };

  calculateWidth = (height) => {
    let aspectRatio = this.state.defaultWidth / this.state.defaultHeight;
    let width = height * aspectRatio;

    this.setState({
      mediaHeight: Math.trunc(height),
      mediaWidth: Math.trunc(width),
    });
  };

  render() {
    const { editorState, imageList, documents } = this.state;

    let editorContainer = styles.editor;
    let urlInput;
    if (this.state.showURLInput) {
      urlInput = (
        <Grid style={styles.gridItemContainer} container>
          <Grid container direction="column" spacing={2} item xs={6}>
            <Grid item>
              <Typography variant="h5">Lägg till bild</Typography>
              <Autocomplete
                id="disabled-options-demo"
                freeSolo
                onChange={(event, newValue) => {
                  this.setState({ urlValue: newValue });
                }}
                onInputChange={(event, newValue) => {
                  this.setState({ urlValue: newValue });
                }}
                ref="url"
                name="url"
                options={
                  imageList
                    ? imageList.map((image, i) => {
                        const imageUrl = "../Upload/" + image;
                        return imageUrl;
                      })
                    : null
                }
                style={{ width: 300 }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Sökväg"
                    helperText="Ange URL till en bild"
                    variant="standard"
                  />
                )}
              />
            </Grid>
            <Grid container item>
              <Grid style={styles.gridItem} item>
                <input
                  onChange={(e) => this.calculateHeight(e.target.value)}
                  ref="data-image-width"
                  type="number"
                  value={this.state.mediaWidth || ""}
                  onKeyDown={this.onURLInputKeyDown}
                  placeholder="Bredd"
                />
              </Grid>
              <Grid item>
                <input
                  onChange={(e) => this.calculateWidth(e.target.value)}
                  ref="data-image-height"
                  type="number"
                  value={this.state.mediaHeight || ""}
                  onKeyDown={this.onURLInputKeyDown}
                  placeholder="Höjd"
                />
              </Grid>
            </Grid>
            <Grid item>
              <input
                onChange={this.onImageAltChange}
                ref="image-alt"
                type="text"
                value={this.state.imageAlt || ""}
                onKeyDown={this.onURLInputKeyDown}
                placeholder="Alternativ text"
              />
            </Grid>
            <Grid container item>
              <Grid style={styles.gridItem} item>
                <input
                  onChange={this.onDataCaptionChange}
                  ref="data-caption"
                  type="text"
                  value={this.state.mediaCaption || ""}
                  onKeyDown={this.onURLInputKeyDown}
                  placeholder="Beskrivning"
                />
              </Grid>
              <Grid item>
                <input
                  onChange={this.onDataSourceChange}
                  ref="data-source"
                  type="text"
                  value={this.state.mediaSource || ""}
                  onKeyDown={this.onURLInputKeyDown}
                  placeholder="Källa"
                />
              </Grid>
            </Grid>
            <Grid container item>
              <Grid style={styles.gridItem} item>
                <select
                  value={this.state.mediaPosition}
                  ref="data-image-position"
                  onChange={this.onDataPositionChange}
                >
                  <option value="left">Vänster</option>
                  <option value="center">Center</option>
                  <option value="right">Höger</option>
                  <option value="floatRight">Höger med text</option>
                  <option value="floatLeft">Vänster med text</option>
                </select>
              </Grid>
              <Grid item>
                <input
                  id="data-image-popup"
                  onChange={this.onDataPopupChange}
                  ref="data-image-popup"
                  type="checkbox"
                  value={this.state.mediaPopup}
                  onKeyDown={this.onURLInputKeyDown}
                />
                <label>Popup</label>
              </Grid>
            </Grid>
            <Grid item>
              <ColorButtonGreen
                style={styles.button}
                variant="contained"
                onMouseDown={this.confirmMedia}
              >
                OK
              </ColorButtonGreen>
              <ColorButtonRed
                variant="contained"
                onMouseDown={this.closeURLInput}
              >
                Avbryt
              </ColorButtonRed>
            </Grid>
          </Grid>
          <Grid container direction="column" item xs={6}>
            <Grid item>
              <p>Förhandsvisning:</p>
            </Grid>
            <Grid item>
              {this.state.urlValue && (
                <img
                  src={this.state.urlValue}
                  alt={this.state.imageAlt}
                  onLoad={this.onImgLoad}
                  width={this.state.mediaWidth}
                  height={this.state.mediaHeight}
                />
              )}
            </Grid>
          </Grid>
        </Grid>
      );
    }

    if (this.state.showTextAreaInput) {
      urlInput = (
        <div style={styles.urlInputContainer}>
          <TextAreaInput
            onCancelClick={() => {
              this.setState({ showTextAreaInput: false });
            }}
            updateEditorState={(newEditorState) => {
              this.setState({ editorState: newEditorState }, () => {
                const selection = editorState.getSelection();
                const blockType = editorState
                  .getCurrentContent()
                  .getBlockForKey(selection.getStartKey())
                  .getType();
                if (blockType !== "blockquote") {
                  this.onChange(
                    RichUtils.toggleBlockType(
                      this.state.editorState,
                      "blockquote"
                    )
                  );
                }
              });
            }}
            editorState={editorState}
          ></TextAreaInput>
        </div>
      );
    }

    if (this.state.showLinkInput) {
      urlInput = (
        <Grid style={styles.gridItemContainer} direction="column" container>
          <Grid item>
            <Typography variant="h5">
              Lägg till {this.getUrlType(this.state.urlType)}
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant="subtitle2">
              Markera den text som ska bli en länk
            </Typography>
          </Grid>
          <Grid item>{this.getUrlInput(this.state.urlType, documents)}</Grid>
          <Grid item>{this.getUrlId(this.state.urlType)}</Grid>
          <Grid item>
            <ColorButtonGreen
              style={styles.button}
              variant="contained"
              onMouseDown={this.confirmLink}
            >
              OK
            </ColorButtonGreen>
            <ColorButtonRed
              variant="contained"
              onMouseDown={this.closeLinkInput}
            >
              Avbryt
            </ColorButtonRed>
          </Grid>
        </Grid>
      );
    }

    return (
      <div style={styles.root}>
        <div style={styles.buttonContainer}>
          <div style={styles.buttons}>
            <InlineStyleControls
              editorState={editorState}
              onToggle={this.toggleInlineStyle}
            />
            <BlockStyleControls
              editorState={editorState}
              onToggle={this.toggleBlockType}
            />
            <StyleButton
              label={<FormatQuoteIcon />}
              tooltip="Lägg till faktaruta"
              onToggle={this.addTextArea}
            />

            <StyleButton
              tooltip="Lägg till en bild"
              label={<ImageIcon />}
              onToggle={this.addImage}
            />

            <StyleButton
              tooltip="Lägg till en webblänk"
              label={<LaunchIcon />}
              onToggle={this.addWebLink}
            />
            <StyleButton
              tooltip="Lägg till en dokumentlänk"
              label={<DescriptionIcon />}
              onToggle={this.addDocumentLink}
            />
            <StyleButton
              tooltip="Lägg till en kartlänk"
              label={<MapIcon />}
              onToggle={this.addMapLink}
            />
          </div>
        </div>
        {urlInput}
        <div style={editorContainer} onClick={this.focus}>
          <Editor
            style={styles.editor}
            blockStyleFn={getBlockStyle}
            blockRendererFn={this.blockRenderer}
            editorState={editorState}
            handleKeyCommand={this.handleKeyCommand}
            handlePastedText={this.handlePastedText}
            handleReturn={this.handleReturn}
            keyBindingFn={this.mapKeyToEditorCommand}
            onChange={this.onChange}
            onFocus={this.handleEditorClick}
            placeholder="Lägg till text..."
            ref="editor"
            readOnly={this.state.onReadOnly}
            plugins={this.plugins}
          />
        </div>
      </div>
    );
  }
}

/* Block types */
function getBlockStyle(block) {
  switch (block.getType()) {
    case "blockquote":
      return "document-blockquote";
    default:
      return null;
  }
}

const BLOCK_TYPES = [
  //{ label: "H1", style: "header-one" },

  { label: <FormatListBulletedIcon />, style: "unordered-list-item" },
  { label: <FormatListNumberedIcon />, style: "ordered-list-item" },
];

const BlockStyleControls = (props) => {
  const { editorState } = props;
  const selection = editorState.getSelection();
  const blockType = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getType();

  return (
    <div style={styles.buttons}>
      {BLOCK_TYPES.map((type) => (
        <StyleButton
          key={type.style}
          active={type.style === blockType}
          label={type.label}
          onToggle={props.onToggle}
          style={type.style}
        />
      ))}
    </div>
  );
};

/* Inline styles */
const INLINE_STYLES = [
  { label: <FormatBoldIcon />, style: "BOLD" },
  { label: <FormatItalicIcon />, style: "ITALIC" },
  { label: <FormatUnderlinedIcon />, style: "UNDERLINE" },
];
const InlineStyleControls = (props) => {
  const currentStyle = props.editorState.getCurrentInlineStyle();
  return (
    <div style={styles.buttons}>
      {INLINE_STYLES.map((type) => (
        <StyleButton
          key={type.style}
          active={currentStyle.has(type.style)}
          label={type.label}
          onToggle={props.onToggle}
          style={type.style}
        />
      ))}
    </div>
  );
};

/* CSS styling */
const styles = {
  root: {
    fontFamily: "'Georgia', serif",
    border: "1px solid #ddd",
  },
  gridItem: {
    marginRight: "8px",
  },
  gridItemContainer: {
    margin: "8px",
  },
  buttonContainer: {
    height: 40,
    borderBottom: "1px solid #ddd",
  },
  buttons: {
    borderRight: "1px solid #ccc",
    float: "left",
  },
  urlInputContainer: {
    marginBottom: 10,
  },
  urlInput: {
    fontFamily: "'Georgia', serif",
    marginRight: 10,
    marginBottom: 8,
  },
  editorContainer: {
    border: "1px solid #ccc",
    cursor: "text",
    minHeight: 80,
    fontSize: 16,
  },
  editor: {
    backgroundColor: "#fff",
    padding: "18px",
  },
  button: {
    marginRight: "8px",
  },
  media: {
    whiteSpace: "initial",
  },
  paper: {
    position: "absolute",
    width: 400,
    border: "2px solid #000",
  },
};
