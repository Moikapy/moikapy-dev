import { type SVGProps } from "react";

export default function NostrIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2L4 6v12l8 4 8-4V6l-8-4zm0 2.2L18 7.4v9.2l-6 3-6-3V7.4L12 4.2zM11 7v6h2V7h-2zm0 8v2h2v-2h-2z" />
    </svg>
  );
}