import React, { Component } from "react";

import {
  PdfLoader,
  PdfHighlighter,
  Tip,
  Highlight,
  Popup,
  AreaHighlight,
} from "./react-pdf-highlighter";

import { highlightsList } from "./highlights/highlights";
import type { IHighlight, NewHighlight } from "./react-pdf-highlighter";

import { Spinner } from "./Spinner";
import { Player } from "./Player";

import "./style/App.css";

const colors = [
  "#ffe28f",
  "#f7bcbb", "#f8bbd0", "#eebff8", "#bbdefb", "#b2dfdb", 
  "#c8e6c9", "#aed581", "#ffe082", "#ffe0b2", "#ffccbc",
]

interface State {
  url: string;
  highlights: Array<IHighlight>;
  currHighlight: IHighlight | null;
}

const getNextId = () => String(Math.random()).slice(2);

const parseIdFromHash = () =>
  document.location.hash.slice("#highlight-".length);

const resetHash = () => {
  document.location.hash = "";
};

const HighlightPopup = ({
  comment,
}: {
  comment: { text: string; emoji: string };
}) =>
  comment.text ? (
    <div className="Highlight__popup">
      {comment.emoji} {comment.text}
    </div>
  ) : null;

const PDF_URL_LIST = [
  "https://arxiv.org/pdf/2110.01691.pdf",
  "https://vivlai.github.io/papers/chi2022.pdf", // Cond Deleg
  "https://arxiv.org/pdf/2107.07170.pdf",
  "https://arxiv.org/pdf/2109.08544.pdf", // Multi-hop
  "https://andrewhead.info/assets/pdf/augmented-formulas.pdf",
  "http://localhost:3000/pdf/3491102.3501873.pdf", // OVRlap
  "http://localhost:3000/pdf/3491102.3517488.pdf", // Signers
  "http://localhost:3000/pdf/3491102.3501866.pdf", // Gig work
]

const VIDEO_URL_LIST = [
  "https://www.youtube.com/watch?v=brCo42DoMu0",
  "https://www.youtube.com/watch?v=4W2ed8C9LYM", // Cond Deleg
  "https://www.youtube.com/watch?v=2CeuNW8lIZo",
  "https://aclanthology.org/2021.emnlp-main.588.mp4", // Multi-hop
  "https://www.youtube.com/watch?v=KH8z1IbXelk",
  "https://www.youtube.com/watch?v=mHDMrg6v17A", // OVRlap
  "https://www.youtube.com/watch?v=BnDR1L6EidA", // Signers
  "https://www.youtube.com/watch?v=GsMyjcggdyI", // Gig work
]

const searchParams = new URLSearchParams(document.location.search);

const paper_idx = searchParams.get("paper_idx");
const isTest = parseInt(searchParams.get("isTest") || "0");

const PDF_URL = PDF_URL_LIST[paper_idx == null ? 0 : parseInt(paper_idx)];
const VIDEO_URL = VIDEO_URL_LIST[paper_idx == null ? 0 : parseInt(paper_idx)];
var testHighlights = highlightsList[paper_idx == null ? 0 : parseInt(paper_idx)];

class App extends Component<{}, State> {
  state = {
    url: PDF_URL,
    highlights: testHighlights,
    currHighlight: null
  };

  scrollViewerTo = (highlight: any) => {};

  scrollToHighlightFromHash = () => {
    const highlight = this.getHighlightById(parseIdFromHash());

    if (highlight) {
      this.scrollViewerTo(highlight);
    }
  };

  componentDidMount() {
    window.addEventListener(
      "hashchange",
      this.scrollToHighlightFromHash,
      false
    );
  }

  getHighlightById(id: string) {
    const highlights : Array<IHighlight> = this.state.highlights;

    return highlights.reverse().find((highlight : IHighlight) => highlight.id === id);
  }

  addHighlight(highlight: NewHighlight) {
    const { highlights } = this.state;

    console.log("Saving highlight", highlight);

    this.setState({
      highlights: [{ ...highlight, id: getNextId() }, ...highlights],
    });
  }

  updateHighlight(highlightId: string, position: Object, content: Object) {
    console.log("Updating highlight", highlightId, position, content);

    this.setState({
      highlights: this.state.highlights.map((h) => {
        const {
          id,
          position: originalPosition,
          content: originalContent,
          ...rest
        } = h;
        return id === highlightId
          ? {
              id,
              position: { ...originalPosition, ...position },
              content: { ...originalContent, ...content },
              ...rest,
            }
          : h;
      }),
    });
  }

  clickHighlight(highlight: IHighlight) {
    this.setState({
      currHighlight: highlight
    });
  }

  updateCurrHighlight(highlight: IHighlight | null) {
    this.setState({
      currHighlight: highlight
    });
    if(highlight !== null)
      this.scrollViewerTo(highlight);
  }

  render() {
    const { url, highlights, currHighlight } = this.state;

    return (
      <div className="App" style={{ display: "flex", height: "100vh" }}>
        <Player
          highlights={highlights}
          currHighlight={currHighlight}
          updateCurrHighlight={this.updateCurrHighlight.bind(this)}
          videoUrl={VIDEO_URL}
          isTest={isTest}
        />
        <div
          style={{
            height: "100vh",
            width: "54vw",
            position: "relative",
          }}
        >
          <PdfLoader url={url} beforeLoad={<Spinner />}>
            {(pdfDocument) => (
              <PdfHighlighter
                pdfDocument={pdfDocument}
                enableAreaSelection={(event) => event.altKey}
                onScrollChange={resetHash}
                // pdfScaleValue="page-width"
                scrollRef={(scrollTo) => {
                  this.scrollViewerTo = scrollTo;

                  this.scrollToHighlightFromHash();
                }}
                onSelectionFinished={(
                  position,
                  content,
                  hideTipAndSelection,
                  transformSelection
                ) => {
                  if(!isTest) {
                    return null;
                  }
                  return (
                    <Tip
                      onOpen={transformSelection}
                      onConfirm={(comment) => {
                        this.addHighlight({ content, position, comment });

                        hideTipAndSelection();
                      }}
                    />
                  )
                }}
                highlightTransform={(
                  highlight,
                  index,
                  setTip,
                  hideTip,
                  viewportToScaled,
                  screenshot,
                  isScrolledTo
                ) => {
                  const isTextHighlight = !Boolean(
                    highlight.content && highlight.content.image
                  );

                  if(highlight.comment) {
                    var actualIdx = parseInt(highlight.comment.text.split("-")[2]);
                  } else {
                    var actualIdx = 0;
                  }
                  
                  var currIdx = -1;
                  if(currHighlight !== null) {
                    var text : string = currHighlight['comment']['text'];
                    currIdx = parseInt(text.split("-")[2]);
                  }
                  var color = colors[actualIdx % colors.length] + (currIdx == actualIdx ? "ff" : "40");


                  const component = isTextHighlight ? (
                    <Highlight
                      isScrolledTo={isScrolledTo}
                      position={highlight.position}
                      comment={highlight.comment}
                      onClick={() => { this.clickHighlight(highlight)}}
                      color={color}
                    />
                  ) : (
                    <AreaHighlight
                      isScrolledTo={isScrolledTo}
                      highlight={highlight}
                      onChange={(boundingRect) => {
                        this.updateHighlight(
                          highlight.id,
                          { boundingRect: viewportToScaled(boundingRect) },
                          { image: screenshot(boundingRect) }
                        );
                      }}
                      isTest={isTest}
                      onClick={() => { this.clickHighlight(highlight)}}
                      color={color}
                    />
                  );

                  return (
                    <Popup
                      popupContent={<HighlightPopup {...highlight} />}
                      key={index}
                      children={component}
                      onMouseOver={() => null}
                      onMouseOut={() => null}
                    />
                  );
                }}
                highlights={highlights}
              />
            )}
          </PdfLoader>
        </div>
      </div>
    );
  }
}

export default App;
