import { Icon } from "./Icon";

export function Footer({ name, note, home = true }: { name: string; note: string; home?: boolean }) {
  return (
    <footer className="footer">
      <span>
        © {new Date().getFullYear()} {name}
      </span>
      <span>{note}</span>
      <a className="text-link" href={home ? "#top" : "#main"}>
        Back to top <Icon name="up" />
      </a>
    </footer>
  );
}
