import { useState } from "react";
import axios from "axios";

export default function useRosterApi() {
  const [data, setData] = useState([]);

  const request = async () => {
    const response = await axios.get("http://localhost:9000/roster");

    setData(response.data);
    return response;
  };

  return {
    data,
    request,
  };
}
