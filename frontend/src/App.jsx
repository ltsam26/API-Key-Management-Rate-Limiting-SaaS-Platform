import { useEffect } from "react";
import API from "./api/axios";

function App() {

  useEffect(() => {
    const testAPI = async () => {
      try {
        const res = await API.get("/");
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