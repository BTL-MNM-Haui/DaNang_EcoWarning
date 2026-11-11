import { useEffect, useRef, useState } from "react";
import { message } from "./api";

// Callers provide primitive request arguments; the loader ref avoids stale closures.
export function useResource(load, dependencies = []) {
  const loader = useRef(load);
  loader.current = load;
  const requestKey = JSON.stringify(dependencies);
  const [value, setValue] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.resolve()
      .then(() => loader.current())
      .then((result) => {
        if (active) setValue(result);
      })
      .catch((err) => {
        if (active) setError(message(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [requestKey, revision]);
  return {
    value,
    error,
    loading,
    reload: () => setRevision((v) => v + 1),
    setValue,
  };
}
