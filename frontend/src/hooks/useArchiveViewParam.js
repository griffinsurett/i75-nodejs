import { useSearchParams } from "react-router-dom";

/**
 * Keeps 'view' in the URL (?view=archived|active) and returns a controlled state.
 * Falls back to 'active' when not present.
 */
export default function useArchiveViewParam() {
  const [params, setParams] = useSearchParams();
  const view = params.get("view") === "archived" ? "archived" : "active";

  const setView = (next) => {
    if (next === "archived") setParams({ view: "archived" });
    else setParams({});
  };

  return [view, setView];
}
