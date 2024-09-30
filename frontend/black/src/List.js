import { ListItem } from "./ListItem";

export function ShoppingList({ items, handleRemoveItem, searchTerm }) {
  let listItems = items;
  if (searchTerm) {
    listItems = items
      .map((i) => {
        return {
          ...i,
          promoted:
            i.name.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0
              ? 1
              : -1,
        };
      })
      .sort((a, b) => b.promoted - a.promoted);
  }

  return (
    <div id="listwrapper">
      <div id="list">
        {items &&
          listItems.map((item) => (
            <ListItem
              showPromoted={!!searchTerm}
              item={item}
              handleRemoveItem={handleRemoveItem}
              key={item.id}
            >
              {item.name}
            </ListItem>
          ))}
      </div>
    </div>
  );
}
