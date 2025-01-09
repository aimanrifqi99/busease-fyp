import { useEffect, useState } from "react";
import axios from "axios";

const useFetch = (initialUrl) => {
  const [data, setData] = useState([]); // Initialize with an empty array
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Initialize error as null
  const [url, setUrl] = useState(initialUrl); // Track the current URL

  const fetchData = async (fetchUrl) => {
    setLoading(true);
    setError(null); // Reset error before fetching
    try {
      const res = await axios.get(fetchUrl);
      setData(res.data); // Set the data returned from the API
    } catch (err) {
      setError(err); // Set error if fetch fails
    } finally {
      setLoading(false); // Ensure loading state is reset
    }
  };

  // Fetch data when the URL changes
  useEffect(() => {
    fetchData(url);
  }, [url]);

  // Function to refetch data with a new URL
  const refetch = (origin, destination, date) => {
    const newUrl = `/schedules/?origin=${origin}&destination=${destination}&departureDate=${date}`;
    setUrl(newUrl); // Set the new URL, triggering a fetch
  };

  return { data, loading, error, refetch };
};

export default useFetch;
