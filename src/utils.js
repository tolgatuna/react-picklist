import reorder from './reorder';

const withNewItemIds = (column, selectedItemIds) => ({
    id: column.id,
    title: column.title,
    selectedItemIds,
});

const reorderSingleDrag = ({columns, selectedItemIds, source, destination}) => {
    // moving in the same list
    if (source.droppableId === destination.droppableId) {
        const column = columns[source.droppableId];
        const reordered = reorder(column.selectedItemIds, source.index, destination.index);

        const updatedColumns = {
            ...columns,
            [column.id]: withNewItemIds(column, reordered)
        };

        return {
            columns: updatedColumns,
            selectedItemIds,
        };
    }

    // moving to a new list
    const home = columns[source.droppableId];
    const foreign = columns[destination.droppableId];

    // the id of the item to be moved
    const itemId = home.selectedItemIds[source.index];

    // remove from home column
    const newHomeItemIds = [...home.selectedItemIds];
    newHomeItemIds.splice(source.index, 1);

    // add to foreign column
    const newForeignItemIds = [...foreign.selectedItemIds];
    newForeignItemIds.splice(destination.index, 0, itemId);

    const updatedColumns = {
        ...columns,
        [home.id]: withNewItemIds(home, newHomeItemIds),
        [foreign.id]: withNewItemIds(foreign, newForeignItemIds),
    };

    return {
        columns: updatedColumns,
        selectedItemIds,
    };
};

export const getHomeColumn = (columns, itemId) => {
    const columnId = Object.keys(columns).find((id) => {
        const column = columns[id];
        return column.selectedItemIds.includes(itemId);
    });

    if (!columnId) {
        console.error('Count not find column for item', itemId, columns);
        throw new Error('boom');
    }

    return columns[columnId];
};

const reorderMultiDrag = ({columns, selectedItemIds, source, destination}) => {
    const start = columns[source.droppableId];
    const dragged = start.selectedItemIds[source.index];

    const insertAtIndex = (() => {
        const destinationIndexOffset = selectedItemIds.reduce(
            (previous, current) => {
                if (current === dragged) {
                    return previous;
                }

                const final = columns[destination.droppableId];
                const column = getHomeColumn(columns, current);

                if (column !== final) {
                    return previous;
                }

                const index = column.selectedItemIds.indexOf(current);

                if (index >= destination.index) {
                    return previous;
                }

                // the selected item is before the destination index
                // we need to account for this when inserting into the new location
                return previous + 1;
            },
            0,
        );

        const result = destination.index - destinationIndexOffset;
        return result;
    })();

    // doing the ordering now as we are required to look up columns
    // and know original ordering
    const orderedSelectedItemIds = [...selectedItemIds];
    orderedSelectedItemIds.sort(
        (a, b) => {
            // moving the dragged item to the top of the list
            if (a === dragged) {
                return -1;
            }
            if (b === dragged) {
                return 1;
            }

            // sorting by their natural indexes
            const columnForA = getHomeColumn(columns, a);
            const indexOfA = columnForA.selectedItemIds.indexOf(a);
            const columnForB = getHomeColumn(columns, b);
            const indexOfB = columnForB.selectedItemIds.indexOf(b);

            if (indexOfA !== indexOfB) {
                return indexOfA - indexOfB;
            }

            // sorting by their order in the selectedItemIds list
            return -1;
        },
    );

    // we need to remove all of the selected tasks from their columns
    const withRemovedItems = Object.keys(columns).reduce(
        (previous, columnId) => {
            const column = columns[columnId];

            // remove the id's of the items that are selected
            const remainingItemIds = column.selectedItemIds.filter((id) => !selectedItemIds.includes(id));

            previous[column.id] = withNewItemIds(column, remainingItemIds);
            return previous;
        },
        columns
    );

    const final = withRemovedItems[destination.droppableId];
    const withInserted = (() => {
        const base = [...final.selectedItemIds];
        base.splice(insertAtIndex, 0, ...orderedSelectedItemIds);
        return base;
    })();

    // insert all selected tasks into final column
    const withAddedTasks = {
        ...withRemovedItems,
        [final.id]: withNewItemIds(final, withInserted),
    };

    return {
        columns: withAddedTasks,
        selectedItemIds: orderedSelectedItemIds,
    };
};

export const mutliDragAwareReorder = (args) => {
    if (args.selectedItemIds.length > 1) {
        return reorderMultiDrag(args);
    }
    return reorderSingleDrag(args);
};

export const multiSelectTo = (columns, selectedItemIds, newItemId) => {
    // Nothing already selected
    if (!selectedItemIds.length) {
        return [newItemId];
    }

    const columnOfNew = getHomeColumn(columns, newItemId);
    const indexOfNew = columnOfNew.selectedItemIds.indexOf(newItemId);

    const lastSelected = selectedItemIds[selectedItemIds.length - 1];
    const columnOfLast = getHomeColumn(columns, lastSelected);
    const indexOfLast = columnOfLast.selectedItemIds.indexOf(lastSelected);

    // multi selecting to another column
    // select everything up to the index of the current item
    if (columnOfNew !== columnOfLast) {
        return columnOfNew.selectedItemIds.slice(0, indexOfNew + 1);
    }

    // multi selecting in the same column
    // need to select everything between the last index and the current index inclusive

    // nothing to do here
    if (indexOfNew === indexOfLast) {
        return null;
    }

    const isSelectingForwards = indexOfNew > indexOfLast;
    const start = isSelectingForwards ? indexOfLast : indexOfNew;
    const end = isSelectingForwards ? indexOfNew : indexOfLast;

    const inBetween = columnOfNew.selectedItemIds.slice(start, end + 1);

    // everything inbetween needs to have it's selection toggled.
    // with the exception of the start and end values which will always be selected
    const toAdd = inBetween.filter(
        (itemId) => {
            // if already selected: then no need to select it again
            if (selectedItemIds.includes(itemId)) {
                return false;
            }
            return true;
        },
    );

    const sorted = isSelectingForwards ? toAdd : [...toAdd].reverse();
    const combined = [...selectedItemIds, ...sorted];

    return combined;
};