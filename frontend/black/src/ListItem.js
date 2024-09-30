import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { SERVER } from "./App";

export function ListItem({ children, item, handleRemoveItem, showPromoted }) {
  const [loading, setLoading] = React.useState(false);

  const performRemove = async (item) => {
    try {
      await fetch(`${SERVER}/clear_item/${item.id}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `auth_key=${localStorage["password"]}`,
      });
      handleRemoveItem(item);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleRemove = async (item) => {
    setLoading(true);
    await performRemove(item);
  };

  const icon = loading ? faSpinner : faCheck;
  const className =
    !showPromoted || item.promoted === 1 ? "item" : "item faded";

  return (
    <div key={item.id} className={className}>
      {children}
      <button
        className="remove"
        onClick={() => handleRemove(item)}
        disabled={loading}
      >
        <FontAwesomeIcon
          icon={icon}
          size="2x"
          pulse={loading}
          style={loading ? { color: "grey" } : {}}
        />
      </button>
    </div>
  );
}
