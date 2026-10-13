import { getFeedSnapshot } from "../lib/feeds";
import { SIGNAL_SOURCES } from "../lib/sources";
import SignalReader from "./signal-reader";
export const dynamic = "force-dynamic";
export default async function Home() {
  const { signals, sources, generatedAt } = await getFeedSnapshot();
  return <SignalReader signals={signals.slice(0, 120)} reports={sources} refreshedAt={generatedAt}
    sources={SIGNAL_SOURCES.map(({ key, name, homepage, region, type }) => ({ key, name, homepage, region, type }))} />;
}
