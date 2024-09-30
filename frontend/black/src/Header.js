import React from "react";

export function Header({ frequentItems, handleAddItem, item, setItem }) {
  const [loading, setLoading] = React.useState(false);

  const addItem = async (itemName) => {
    if (loading) return;
    setLoading(true);
    await handleAddItem(itemName);
    setLoading(false);
  };

  return (
    <div id="top">
      <form
        className="mainForm"
        onSubmit={async (e) => {
          e.preventDefault();
          await addItem(item);
        }}
      >
        <input
          id="input"
          autoFocus
          type="text"
          maxLength="100"
          placeholder="Milk"
          aria-labelledby="submit"
          value={item}
          onChange={(e) => setItem(e.target.value)}
        />
        <button
          type="button"
          id="submit"
          disabled={loading}
          onClick={async (e) => {
            await addItem(item);
          }}
        >
          +
        </button>
      </form>
      <div id="frequent-wrapper">
        <div id="frequent">
          {frequentItems &&
            frequentItems
              .filter((i) => i.visible && i.name.indexOf(item) >= 0)
              .map((i) => (
                <div
                  key={i.name}
                  className="item"
                  onClick={async (e) => {
                    if (loading) return;
                    await addItem(i.name);
                  }}
                >
                  {i.name}
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
