/** Renders plain help text with any http(s) URLs in it as links that open in a new tab. */
export function Linkified({ text }: { text: string }) {
  // Trailing punctuation belongs to the sentence, not the URL.
  const parts = text.split(/(https?:\/\/[^\s]+?)(?=[).,;]*(?:\s|$))/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noreferrer"
            className="break-all text-brand-600 underline hover:text-brand-700"
          >
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </>
  );
}
