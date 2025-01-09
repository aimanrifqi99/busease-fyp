import { useEffect, useState } from "react"; 
import axios from "axios";

const useFetch = (initialUrl) => {
  const [data, setData] = useState([]); // Data from the API
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState(null); // Error state
  const [url, setUrl] = useState(initialUrl); // Track the current URL

  const fetchData = async (fetchUrl) => {
    if (!fetchUrl) return; // Skip if no URL is provided

    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api${fetchUrl}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(url);
  }, [url]);

  const buildQueryParams = (params) =>
    Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

  const refetch = (params) => {
    const query = buildQueryParams(params);
    const newUrl = `${process.env.REACT_APP_API_URL}/schedules/?${query}`;
    setUrl(newUrl);
  };

  return { data, loading, error, refetch };
};

export default useFetch;
