// frontend/src/hooks/useArchiveList.js
import { useState, useEffect } from "react";
import useArchiveViewParam from "./useArchiveViewParam";

/**
 * Universal archive hook for managing archived/active lists
 * @param {Function|Array} fetchers - Single API function or array of functions for parallel fetching
 * @param {Object} options - Configuration options
 */
export default function useArchiveList(fetchers, options = {}) {
  const {
    paramKey = "archived",
    transformData = (data) => data,
    defaultError = "Failed to fetch data",
    combineResults = null,
  } = options;

  const [view, setView] = useArchiveViewParam();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [rawResults, setRawResults] = useState(null);

  const isArchived = view === "archived";

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const params = isArchived ? { [paramKey]: "true" } : {};

      const fetcherArray = Array.isArray(fetchers) ? fetchers : [fetchers];
      const promises = fetcherArray.map((fetcher) => fetcher(params));
      const responses = await Promise.all(promises);

      const allSuccessful = responses.every((res) => res.data?.success);

      if (allSuccessful) {
        if (fetcherArray.length === 1) {
          const transformedData = transformData(responses[0].data.data || []);
          setData(transformedData);
          setRawResults(null);
        } else {
          const results = responses.map((res) => res.data.data || []);

          if (combineResults) {
            const combined = combineResults(results, responses);
            setData(combined);
            setRawResults(results);
          } else {
            const flattened = results.flat();
            const transformedData = transformData(flattened);
            setData(transformedData);
            setRawResults(results);
          }
        }
      } else {
        setError(defaultError);
        setData([]);
        setRawResults(null);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || defaultError);
      console.error("Error fetching data:", err);
      setData([]);
      setRawResults(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isArchived, refreshTrigger]);

  const refresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return {
    view,
    setView,
    data,
    rawResults,
    loading,
    error,
    isArchived,
    refresh,
    fetchData,
  };
}
