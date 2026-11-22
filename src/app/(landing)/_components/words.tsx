import { Fragment, type CSSProperties } from "react";

// Splits a text into words so each one can ease in a little after the one before it (.kb-word in globals.css).
// `start` is the number of words that come before this text in the same heading.
export default function Words({ text, start = 0 }: { text: string; start?: number }) {
  return text.split(" ").map((word, index) => (
    <Fragment key={index}>
      {index > 0 && " "}
      <span className="kb-word" style={{ "--i": start + index } as CSSProperties}>
        {word}
      </span>
    </Fragment>
  ));
}
