import { type SVGProps } from "react";

export default function KickIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M2 2h6.4v4.8H12V2h4.8v6.9L12 12l4.8 3.1V22H12v-4.8H8.4V22H2V2zm14.4 0H22v6.4l-3.2 1.6L22 11.6v2.4l-3.2 1.6 3.2 1.6V22h-5.6v-6.4L12 12l3.2-3.2V2z" />
    </svg>
  );
}