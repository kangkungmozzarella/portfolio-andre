const paths = {
  arrow: "M7 17 17 7M8 7h9v9",
  left: "M20 12H4m7-7-7 7 7 7",
  right: "M4 12h16m-7-7 7 7-7 7",
  up: "M12 20V4M5 11l7-7 7 7",
  plus: "M12 5v14M5 12h14",
  close: "m6 6 12 12M6 18 18 6",
  play: "M8 5.5v13l10.5-6.5z",
  images: "M4 6h16v12H4zM4 15l4.5-4.5 4 4 2.5-2.5L20 17",
  menu: "M4 8h16M4 16h16",
};

export function Icon({ name }: { name: keyof typeof paths }) {
  return (
    <svg className="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={paths[name]} />
    </svg>
  );
}
