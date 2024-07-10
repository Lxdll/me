import { useGlobalStore } from "./store";

function App() {
  const count = useGlobalStore((state) => state.count);
  const increase = useGlobalStore((state) => state.increase);
  const decrease = useGlobalStore((state) => state.decrease);

  return (
    <div className="w-full h-full flex flex-col justify-center items-center">
      <div className="text-white font-semibold text-4xl">{count}</div>
      <button onClick={() => increase()}>
        <span className="text-white border">increase</span>
      </button>
      <button onClick={() => decrease()}>
        <span className="text-white border">decrease</span>
      </button>
    </div>
  );
}

export default App;
