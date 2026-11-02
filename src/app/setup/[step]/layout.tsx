export const dynamicParams = false;

export function generateStaticParams() {
  return ["players", "undercover", "mrwhite", "topics", "names", "timer"].map((step) => ({ step }));
}

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
