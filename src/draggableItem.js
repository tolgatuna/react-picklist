import React, {Component} from 'react';
import styled from 'styled-components';
import {Draggable} from 'react-beautiful-dnd';
import {grid, colors, borderRadius, keyCodes, primaryButton} from './constants';

const getBackgroundColor = ({isSelected, isGhosting}) => {
    if (isGhosting) {
        return colors.grey.light;
    }

    if (isSelected) {
        return colors.blue.light;
    }

    return colors.grey.light;
};

const getColor = ({isSelected, isGhosting}) => {
    if (isGhosting) {
        return 'darkgrey';
    }
    if (isSelected) {
        return colors.blue.deep;
    }
    return colors.black;
};

const Container = styled.div`
  background-color: ${props => getBackgroundColor(props)};
  color: ${props => getColor(props)};
  padding: ${grid}px;
  margin-bottom: ${grid}px;
  border-radius: ${borderRadius}px;
  font-size: 18px;
  border: 1px solid ${colors.shadow};
  ${props =>
    props.isDragging
        ? `box-shadow: 2px 2px 1px ${colors.shadow};`
        : ''} ${props =>
    props.isGhosting
        ? 'opacity: 0.8;'
        : ''}
  /* needed for SelectionCount */
  position: relative;
  /* avoid default outline which looks lame with the position: absolute; */
  &:focus {
    outline: none;
    border-color: ${colors.blue.deep};
  }
`;
/* stylelint-disable block-no-empty */
const Content = styled.div``;

const size = 30;
const SelectionCount = styled.div`
  right: -${grid}px;
  top: -${grid}px;
  color: ${colors.white};
  background: ${colors.blue.deep};
  border-radius: 50%;
  height: ${size}px;
  width: ${size}px;
  line-height: ${size}px;
  position: absolute;
  text-align: center;
  font-size: 0.8rem;
`;

export default class DraggableItem extends Component {
    onKeyDown = (event, provided, snapshot) => {
        if (provided.dragHandleProps) {
            provided.dragHandleProps.onKeyDown(event);
        }

        if (event.defaultPrevented) {
            return;
        }

        if (snapshot.isDragging) {
            return;
        }

        if (event.keyCode !== keyCodes.enter) {
            return;
        }

        // we are using the event for selection
        event.preventDefault();

        const wasMetaKeyUsed = event.metaKey || event.ctrlKey;
        const wasShiftKeyUsed = event.shiftKey;

        this.performAction(wasMetaKeyUsed, wasShiftKeyUsed);
    };

    onClick = (event) => {
        if (event.defaultPrevented) {
            return;
        }

        if (event.button !== primaryButton) {
            return;
        }

        // marking the event as used
        event.preventDefault();

        const wasMetaKeyUsed = event.metaKey || event.ctrlKey;
        const wasShiftKeyUsed = event.shiftKey;

        this.performAction(wasMetaKeyUsed, wasShiftKeyUsed);
    };

    onTouchEnd = (event) => {
        if (event.defaultPrevented) {
            return;
        }

        // marking the event as used
        // we would also need to add some extra logic to prevent the click
        // if this element was an anchor
        event.preventDefault();
        this.props.toggleSelectionInGroup(this.props.item.id);
    };

    performAction = (wasMetaKeyUsed, wasShiftKeyUsed) => {
        const {item, toggleSelection, toggleSelectionInGroup, multiSelectTo} = this.props;

        if (wasMetaKeyUsed) {
            toggleSelectionInGroup(item.id);
            return;
        }

        if (wasShiftKeyUsed) {
            multiSelectTo(item.id);
            return;
        }

        toggleSelection(item.id);
    };

    render() {
        const item = this.props.item;
        const index = this.props.index;
        const selectionCount = this.props.selectionCount;
        const isSelected = this.props.isSelected;
        const isGhosting = this.props.isGhosting;
        return (
            <Draggable draggableId={item.id} index={index}>
                {(provided, snapshot) => {
                    const shouldShowSelection = snapshot.isDragging && selectionCount > 1;
                    return (
                        <Container
                            innerRef={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={this.onClick}
                            onTouchEnd={this.onTouchEnd}
                            onKeyDown={(event: KeyboardEvent) =>
                                this.onKeyDown(event, provided, snapshot)
                            }
                            isDragging={snapshot.isDragging}
                            isSelected={isSelected}
                            isGhosting={isGhosting}
                        >
                            <Content>{item.content}</Content>
                            {shouldShowSelection ? (
                                <SelectionCount>{selectionCount}</SelectionCount>
                            ) : null}
                        </Container>
                    );
                }}
            </Draggable>
        );
    }
}