import React, {Component} from 'react';
import styled from 'styled-components';
import memoizeOne from 'memoize-one';
import {Droppable} from 'react-beautiful-dnd';
import {grid, colors, borderRadius} from './constants';
import DraggableItem from './draggableItem';

const Container = styled.div`
  width: 300px;
  margin: ${grid}px;
  border-radius: ${borderRadius}px;
  border: 1px solid ${colors.grey.dark};
  background-color: ${colors.grey.medium};
  /* we want the column to take up its full height */
  display: flex;
  flex-direction: column;
`;

const Title = styled.h3`
  font-weight: bold;
  padding: 0 8px 0 16px;
`;

const ItemList = styled.div`
  padding: 0 8px 0 8px;
  min-height: 200px;
  max-height: 250px;
  flex-grow: 1;
  transition: background-color 0.2s ease;
  ${props => props.isDraggingOver ? `background-color: ${colors.grey.darker}` : ''};
  overflow-y: auto;
`;

const getSelectedMap = memoizeOne((selectedItemIds) =>
    selectedItemIds.reduce((previous, current) => {
        previous[current] = true;
        return previous;
    }, {}),
);

export default class Column extends Component {
    render() {
        const column = this.props.column;
        const items = this.props.items;
        const selectedItemIds = this.props.selectedItemIds;
        const draggingItemId = this.props.draggingItemId;
        return (
            <Container>
                <Title>{column.title}</Title>
                <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                        <ItemList
                            innerRef={provided.innerRef}
                            isDraggingOver={snapshot.isDraggingOver}
                            {...provided.droppableProps}
                        >
                            {items.map((item, index) => {
                                const isSelected = getSelectedMap(selectedItemIds)[item.id];
                                const isGhosting = isSelected && Boolean(draggingItemId) && draggingItemId !== item.id;
                                return (
                                    <DraggableItem
                                        item={item}
                                        index={index}
                                        key={item.id}
                                        isSelected={isSelected}
                                        isGhosting={isGhosting}
                                        selectionCount={selectedItemIds.length}
                                        toggleSelection={this.props.toggleSelection}
                                        toggleSelectionInGroup={this.props.toggleSelectionInGroup}
                                        multiSelectTo={this.props.multiSelectTo}
                                    />
                                );
                            })}
                            {provided.placeholder}
                        </ItemList>
                    )}
                </Droppable>
            </Container>
        );
    }
}