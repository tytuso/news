import { getSignals } from "../lib/feeds";
import { SIGNAL_SOURCES } from "../lib/sources";
import SignalReader from "./signal-reader";

export const dynamic = "force-dynamic";

export default async function Home() {
  const signals = await getSignals(110);
  return <SignalReader signals={signals} sources={SIGNAL_SOURCES.map(({ key, name, homepage, region, type }) => ({ key, name, homepage, region, type }))} />;
}
