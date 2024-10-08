import React from "react";
import "./App.css";
import { AisleList } from "./AisleList";
import { Header } from "./Header";
import { ShoppingList } from "./List";
import { Keyboard } from "./Keyboard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faListCheck,
  faShoppingCart,
  faSpinner,
  faSync,
} from "@fortawesome/free-solid-svg-icons";
import { useData } from "./utils";

/* Authkey stuff */

const hashCode = (s) =>
  s.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

let authKey = null;
const urlParams = new URLSearchParams(window.location.search);
authKey = urlParams.get("password");

if (!authKey) {
  authKey = localStorage ? localStorage["password"] : null;
}
while (hashCode(authKey) !== 1915171345) {
  authKey = prompt("Password:");
}
localStorage["password"] = authKey;

const IS_DEV = !process.env.NODE_ENV || process.env.NODE_ENV === "development";

export const SERVER = IS_DEV ? "http://localhost:3001" : "";

/* --- */

const IS_PI = navigator.userAgent.toLowerCase().indexOf("armv7") >= 0;

const MODES = {
  LIST: "LIST",
  SHOPPING: "SHOPPING",
};

export const ITEMS_URL = `${SERVER}/get_items/?auth_key=${localStorage["password"]}`;

function App() {
  const [item, setItem] = React.useState("");
  const [mode, setMode] = React.useState(MODES.LIST);

  const { list, frequent, isLoading, error, mutate } = useData();

  if (isLoading) {
    return (
      <main>
        <FontAwesomeIcon
          icon={faSpinner}
          size="2x"
          pulse={true}
          className="main-loading"
        />
      </main>
    );
  } else if (error) {
    return (
      <main className="error">
        <p>Error: {error} </p>
        <button onClick={() => window.location.reload()}>
          <FontAwesomeIcon icon={faSync} /> Reload
        </button>
      </main>
    );
  }

  const itemNames = Object.values(list).map((i) => i.name);
  const filteredFrequent = frequent.map((i) => {
    return { name: i.name, visible: !itemNames.includes(i.name) };
  });

  const addItem = async (itemName) => {
    if (!itemName) return;
    try {
      const response = await fetch(`${SERVER}/add_item/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `auth_key=${localStorage["password"]}&name=${encodeURIComponent(itemName)}`,
      });
      const data = await response.json();
      if (data.error) {
        alert(data.error);
        setItem("");
        return;
      }
      const newItem = data;
      const nextList = [...list, newItem];
      mutate({
        items: nextList,
        frequent: frequent,
      });
      setItem("");
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleClear = async () => {
    if (!window.confirm("Clear all items?")) return;
    try {
      await fetch(`${SERVER}/clear_items/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `auth_key=${localStorage["password"]}`,
      });
      mutate({
        items: [],
        frequent: frequent,
      });
      setItem("");
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleRemoveItem = function (removeItem) {
    const nextList = list.filter((item) => item.id !== removeItem.id);
    mutate({
      items: nextList,
      frequent: frequent,
    });
  };

  const handleLetter = function (l) {
    setItem(`${item}${l}`);
  };

  const handleBackspace = function (l) {
    setItem(item.substring(0, item.length - 1));
  };

  const handleEnter = function () {
    addItem(item);
  };

  const toggleMode = function () {
    if (mode === MODES.LIST) {
      setMode(MODES.SHOPPING);
    } else {
      setMode(MODES.LIST);
    }
  };

  const handleUpdateAisle = function (item, aisle) {
    const nextList = [
      ...list.map((l) => {
        if (l.id === item.id) {
          return { ...item, aisle: aisle };
        } else {
          return l;
        }
      }),
    ];
    mutate({
      items: nextList,
      frequent: frequent,
    });
  };

  return (
    <>
      <main style={{ height: "100%" }} className={IS_PI ? "pi" : ""}>
        {mode === MODES.LIST ? (
          <>
            <Header
              frequentItems={filteredFrequent}
              handleAddItem={addItem}
              item={item}
              setItem={setItem}
            />
            <div className="flex-wrapper">
              <ShoppingList
                items={list}
                handleRemoveItem={handleRemoveItem}
                searchTerm={item}
              />
              {IS_PI && (
                <Keyboard
                  handleLetter={handleLetter}
                  handleBackspace={handleBackspace}
                  handleEnter={handleEnter}
                  handleClear={handleClear}
                />
              )}
            </div>
          </>
        ) : (
          <AisleList
            items={list}
            handleRemoveItem={handleRemoveItem}
            handleUpdateAisle={handleUpdateAisle}
          />
        )}
        {!IS_PI && (
          <div className="shopping-mode" onClick={toggleMode}>
            <FontAwesomeIcon
              icon={mode === MODES.LIST ? faShoppingCart : faListCheck}
            />
          </div>
        )}
      </main>
    </>
  );
}

export default App;
