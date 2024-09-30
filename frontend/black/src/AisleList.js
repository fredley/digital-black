import React from "react";
import { Aisle } from "./Aisle";

export function AisleList({ items, handleRemoveItem, handleUpdateAisle }) {
  const byAisle = {};
  items.forEach((item) => {
    const aisleName = item.aisle ?? "unknown";
    if (!byAisle[aisleName]) {
      byAisle[aisleName] = [item];
    } else {
      byAisle[aisleName].push(item);
    }
  });
  const [active, setActive] = React.useState("");
  return (
    <div id="shopping">
      {Object.keys(byAisle)
        .sort((a, b) => a.localeCompare(b))
        .map((aisleName) => (
          <Aisle
            active={active === aisleName}
            setActive={setActive}
            items={byAisle[aisleName]}
            title={aisleName}
            key={aisleName}
            handleRemoveItem={handleRemoveItem}
            handleUpdateAisle={handleUpdateAisle}
          />
        ))}
    </div>
  );
}
