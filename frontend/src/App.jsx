import { useEffect } from "react";
import API from "./api/axios";

function App() {

  useEffect(() => {
    const testAPI = async () => {
      try {
        const res = await API.get("/public/data", {
          headers: {
            "x-api-key": "8385157efe7eceb6a81bf1b32f31112b6e77a90d380d11c2abf5bcb71b9995ba"
          }
        });
        console.log(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    testAPI();
  }, []);

  return (
    <div>
      <h1>Frontend Connected</h1>
    </div>
  );
}

export default App;