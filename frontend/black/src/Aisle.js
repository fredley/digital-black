import React from "react";
import {
  faCaretDown,
  faCaretRight,
  faEdit,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ListItem } from "./ListItem";
import { SERVER } from "./App";

export function Aisle({
  active,
  setActive,
  items,
  title,
  handleRemoveItem,
  handleUpdateAisle,
}) {
  const className = active ? "aisle" : "aisle collapsed";
  const [showing, setShowing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [currentItem, setCurrentItem] = React.useState("");

  const showModal = (item) => {
    setShowing(true);
    setCurrentItem(item);
  };

  const AISLES = [
    "Baby",
    "Bakery",
    "Baking",
    "Bread",
    "Ceral",
    "Cupboard",
    "Dairy",
    "Drinks",
    "Fish",
    "Freezer",
    "Fruit",
    "Home",
    "Meat",
    "Pharmacy",
    "Read Meals",
    "Snacks",
    "Tea & Coffee",
    "Tins",
    "Vegetables",
  ];

  const updateAisle = async (item, aisle) => {
    setLoading(true);
    try {
      const response = await fetch(`${SERVER}/set_aisle/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `auth_key=${localStorage["password"]}&aisle=${encodeURIComponent(aisle)}&item=${encodeURIComponent(item.name)}`,
      });
      const data = await response.json();
      if (data.error) {
        alert(data.error);
        setLoading(false);
        return;
      }
      setLoading(false);
      setShowing(false);
      handleUpdateAisle(item, aisle);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const [aisle, setAisle] = React.useState("");

  if (showing) {
    return (
      <div class="shade">
        <div class="modal">
          <form>
            <label htmlFor="aisleInput">
              Select new aisle for {currentItem.name}:
            </label>
            <select
              value={aisle}
              disabled={loading}
              onChange={(e) => setAisle(e.target.value)}
            >
              {AISLES.map((a) => (
                <option value={a} key={a}>
                  {a}
                </option>
              ))}
            </select>
            <button disabled={loading} onClick={() => setShowing(false)}>
              Cancel
            </button>
            <button
              disabled={loading}
              onClick={() => updateAisle(currentItem, aisle)}
            >
              Update
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <ul className={className}>
      <div
        className="title"
        onClick={() => {
          active ? setActive("") : setActive(title);
        }}
      >
        <FontAwesomeIcon
          icon={active ? faCaretDown : faCaretRight}
          className="highlight"
        />{" "}
        {title}
      </div>
      {items.map((item) => (
        <ListItem
          showPromoted={false}
          item={item}
          handleRemoveItem={handleRemoveItem}
          key={item.id}
        >
          <FontAwesomeIcon
            icon={faEdit}
            className="highlight"
            onClick={() => showModal(item)}
          />{" "}
          {item.name}
        </ListItem>
      ))}
    </ul>
  );
}
