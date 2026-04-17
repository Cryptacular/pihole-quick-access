import { DnsBlockingControl } from "./components/pihole/DnsBlockingControl";
import "./index.css";

export function App() {
  return (
    <div className="container mx-auto p-8 text-center relative z-10">
      <h1 className="text-5xl font-bold my-4 leading-tight">
        Pihole Dashboard
      </h1>

      <DnsBlockingControl />
    </div>
  );
}

export default App;
