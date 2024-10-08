import { AnimatePresence, motion } from "framer-motion";
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
        <AnimatePresence>
          {items &&
            listItems.map((item) => (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 65 }}
                exit={{ height: 0 }}
                key={item.id}
              >
                <ListItem
                  showPromoted={!!searchTerm}
                  item={item}
                  handleRemoveItem={handleRemoveItem}
                >
                  {item.name}
                </ListItem>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
