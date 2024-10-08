import useSWR from "swr";
import { ITEMS_URL } from "./App";

export const fetcher = async (url) => {
  const response = await fetch(url);
  return await response.json();
};

export function useData() {
  const { data, error, isLoading, mutate } = useSWR(ITEMS_URL, fetcher, {
    refreshInterval: 1000 * 30, // refresh every 30s
  });

  if (data !== undefined) {
    return {
      list: data.items,
      frequent: data.frequent,
      isLoading,
      mutate,
    };
  } else {
    return { error, isLoading, mutate };
  }
}
