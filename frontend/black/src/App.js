import React from "react";
import "./App.css";
import { AisleList } from "./AisleList";
import { Header } from "./Header";
import { ShoppingList } from "./List";
import { Keyboard } from "./Keyboard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faListCheck, faShoppingCart } from "@fortawesome/free-solid-svg-icons";

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

/* --- */

const IS_PI = navigator.userAgent.toLowerCase().indexOf("armv7") >= 0;

const MODES = {
  LIST: "LIST",
  SHOPPING: "SHOPPING",
};

function App() {
  const [item, setItem] = React.useState("");
  const [timer, setTimer] = React.useState("");
  const [list, setList] = React.useState([]);
  const [refresher, setRefresher] = React.useState("");
  const [frequent, setFrequent] = React.useState([]);
  const [mode, setMode] = React.useState(MODES.LIST);

  React.useEffect(() => {
    if (timer) {
      return;
    }

    setTimer(
      setInterval(() => {
        setRefresher(new Date().getUTCMilliseconds());
      }, 1000 * 30)
    );
  }, [timer]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `/get_items/?auth_key=${localStorage["password"]}`
        );
        const result = await response.json();
        setList(result.items);
        refreshFrequent(result.frequent, result.items);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [refresher]);

  const addItem = async (itemName) => {
    if (!itemName) return;
    try {
      const response = await fetch(`/add_item/`, {
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
      setList(nextList);
      refreshFrequent([...frequent], nextList);
      setItem("");
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleClear = async () => {
    if (!window.confirm("Clear all items?")) return;
    try {
      await fetch(`/clear_items/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `auth_key=${localStorage["password"]}`,
      });
      setList([]);
      refreshFrequent([...frequent], []);
      setItem("");
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const refreshFrequent = (nextFrequent, nextList) => {
    const itemNames = Object.values(nextList).map((i) => i.name);
    setFrequent(
      nextFrequent.map((i) => {
        return { name: i.name, visible: !itemNames.includes(i.name) };
      })
    );
  };

  const handleRemoveItem = function (removeItem) {
    const nextList = list.filter((item) => item.id !== removeItem.id);
    setList(nextList);
    refreshFrequent([...frequent], nextList);
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
    setList(nextList);
  };

  return (
    <>
      <main>
        {mode === MODES.LIST ? (
          <>
            <Header
              frequentItems={frequent}
              handleAddItem={addItem}
              item={item}
              setItem={setItem}
            />
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
