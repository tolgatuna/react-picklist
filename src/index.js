import React, {Component} from 'react'
import styled from 'styled-components'
import {DragDropContext} from 'react-beautiful-dnd'
import Column from './column'
import {mutliDragAwareReorder, multiSelectTo as multiSelect} from './utils'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { change } from 'redux-form'

const Container = styled.div`
  display: flex;
  user-select: none;
`

const ButtonGroup = styled.div`
  margin-top: 30px;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 50px;
`

const Button = styled.button`
  background: ${props => props.disabled ? '#cccccc' : 'palevioletred'};
  color: ${props => props.disabled ? '#666666' : 'white'};
  border: ${props => props.disabled ? '2px solid #999999' : '2px solid palevioletred'}; 

  font-size: 1em;
  margin: 2px;
  padding-top: 5px;
  border-radius: 3px;
  
  width: 40px;
  height: 40px;
`
const leftColumnId = '1'
const rightColumnId = '2'

const getItems = (columns, items, columnId) => {
  return columns[columnId].selectedItemIds.map((itemId) => items[itemId])
}

class PickList extends Component {
  state = {
    items: this.props.items,
    columns: {
      '1': {
        ...this.props.leftColumn,
        id: '1'
      },
      '2': {
        ...this.props.rightColumn,
        id: '2'
      }
    },
    selectedItemIds: [],
    draggingItemId: null,
    isRightActive: false,
    isRightAllActive: true,
    isLeftActive: false,
    isLeftAllActive: false
  };

  componentDidMount() {
    window.addEventListener('click', this.onWindowClick)
    window.addEventListener('keydown', this.onWindowKeyDown)
    window.addEventListener('touchend', this.onWindowTouchEnd)
    this.controlSelectedItems(this.state.selectedItemIds)
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.onWindowClick)
    window.removeEventListener('keydown', this.onWindowKeyDown)
    window.removeEventListener('touchend', this.onWindowTouchEnd)
  }

  onDragStart = (start) => {
    const id = start.draggableId;
    const selected = this.state.selectedItemIds.find((itemId) => itemId === id)

    // if dragging an item that is not selected - unselect all items
    if (!selected) {
      this.unSelectAll()
    }
    this.setState({draggingItemId: start.draggableId})
  };

  onDragEnd = (result, announce, outSelectedIds) => {
    const destination = result.destination;
    const source = result.source;

    // nothing to do
    if (!destination || result.reason === 'CANCEL') {
      this.setState({draggingItemId: null});
      return
    }

    const processed = mutliDragAwareReorder({
      items: this.state.items,
      columns: this.state.columns,
      selectedItemIds: outSelectedIds !== undefined ? outSelectedIds : this.state.selectedItemIds,
      source,
      destination
    })

    this.setState({
      ...processed,
      draggingItemId: null
    })
    this.controlSelectedItems(this.state.selectedItemIds)
  };

  onWindowKeyDown = (event) => {
    if (event.defaultPrevented) {
      return
    }

    if (event.key === 'Escape') {
      this.unSelectAll()
    }
  };

  onWindowClick = (event) => {
    if (event.defaultPrevented) {
      return
    }
    this.unSelectAll()
  };

  onWindowTouchEnd = (event) => {
    if (event.defaultPrevented) {
      return
    }
    this.unSelectAll()
  };

  controlSelectedItems = (selectedItemIds) => {
    let isRightAllActive = this.state.columns[leftColumnId].selectedItemIds.length > 0;
    let isLeftAllActive = this.state.columns[rightColumnId].selectedItemIds.length > 0;

    let isRightActive = false
    let isLeftActive = false

    selectedItemIds.map(id => {
      if (this.state.columns[leftColumnId].selectedItemIds.includes(id)) {
        isRightActive = true
      }
    })

    selectedItemIds.map(id => {
      if (this.state.columns[rightColumnId].selectedItemIds.includes(id)) {
        isLeftActive = true
      }
    })

    this.setState({
      isRightAllActive,
      isLeftAllActive,
      isRightActive,
      isLeftActive
    })

    this.props.dispatch(change(this.props.formId, this.props.name, this.state.columns[rightColumnId].selectedItemIds))
  };

  toggleSelection = (itemId) => {
    const selectedItemIds = this.state.selectedItemIds;
    const wasSelected = selectedItemIds.includes(itemId);

    const newItemIds = (() => {
      // Item was not previously selected
      // now will be the only selected item
      if (!wasSelected) {
        return [itemId]
      }

      // item was part of a selected group will now become the only selected item
      if (selectedItemIds.length > 1) {
        return [itemId]
      }

      // item was previously selected but not in a group
      // we will now clear the selection
      return []
    })()

    this.setState({selectedItemIds: newItemIds});
    this.controlSelectedItems(newItemIds);
  };

  toggleSelectionInGroup = (itemId) => {
    const selectedItemIds = this.state.selectedItemIds;
    const index = selectedItemIds.indexOf(itemId);

    // if not selected - add it to the selected items
    const newSelectedIds = [...selectedItemIds, itemId]
    if (index === -1) {
      this.setState({selectedItemIds: newSelectedIds})
      this.controlSelectedItems(newSelectedIds)
      return
    }

    // it was previously selected and now needs to be removed from the group
    const shallow = [...selectedItemIds]
    shallow.splice(index, 1)
    this.setState({selectedItemIds: shallow})
    this.controlSelectedItems(shallow)
  };

  // This behaviour matches the MacOSX finder selection
  multiSelectTo = (newItemId) => {
    const updated = multiSelect(
      this.state.columns,
      this.state.selectedItemIds,
      newItemId
    )

    if (updated == null) {
      return
    }

    this.setState({selectedItemIds: updated});
    this.controlSelectedItems(updated);
  };

  unSelectAll = () => {
    this.setState({selectedItemIds: []});
    this.controlSelectedItems([]);
  };

  onRightButtonPressed = () => {
    const rightButtonPressedResult = {
      draggableId: "0",
      reason: "DROP",
      type: "DEFAULT",
      destination: {
        index: this.state.columns[rightColumnId].selectedItemIds.length,
        droppableId: rightColumnId
      },
      source: {
        index: 0,
        droppableId: leftColumnId
      }
    }

    this.onDragEnd(rightButtonPressedResult);
  };

  onRightAllButtonPressed = () => {
    const rightButtonPressedResult = {
      draggableId: "0",
      reason: "DROP",
      type: "DEFAULT",
      destination: {
        index: this.state.columns[rightColumnId].selectedItemIds.length,
        droppableId: rightColumnId
      },
      source: {
        index: 0,
        droppableId: leftColumnId
      }
    }

    const outSelectedIds = this.state.columns[leftColumnId].selectedItemIds;
    this.onDragEnd(rightButtonPressedResult, null, outSelectedIds);
  };

  onLeftButtonPressed = () => {
    const leftButtonPressedResult = {
      draggableId: "0",
      reason: "DROP",
      type: "DEFAULT",
      destination: {
        index: this.state.columns[leftColumnId].selectedItemIds.length,
        droppableId: leftColumnId
      },
      source: {
        index: 0,
        droppableId: rightColumnId
      }
    }

    this.onDragEnd(leftButtonPressedResult);
  };

  onLeftAllButtonPressed = () => {
    const leftButtonPressedResult = {
      draggableId: "0",
      reason: "DROP",
      type: "DEFAULT",
      destination: {
        index: this.state.columns[leftColumnId].selectedItemIds.length,
        droppableId: leftColumnId
      },
      source: {
        index: 0,
        droppableId: rightColumnId
      }
    }

    const outSelectedIds = this.state.columns[rightColumnId].selectedItemIds;
    this.onDragEnd(leftButtonPressedResult, null, outSelectedIds);
  };

  render() {
    const columns = this.state.columns;
    const items = this.state.items;
    const selectedItemIds = this.state.selectedItemIds;

    return (
      <DragDropContext
        onDragStart={this.onDragStart}
        onDragEnd={this.onDragEnd}
      >
        <Container>
          <Column
            column={columns[leftColumnId]}
            items={getItems(columns, items, leftColumnId)}
            selectedItemIds={selectedItemIds}
            key={leftColumnId}
            draggingItemId={this.state.draggingItemId}
            toggleSelection={this.toggleSelection}
            toggleSelectionInGroup={this.toggleSelectionInGroup}
            multiSelectTo={this.multiSelectTo}
          />
          <ButtonGroup>
            <Button onClick={this.onRightButtonPressed} disabled={!this.state.isRightActive}>{'>'}</Button>
            <Button onClick={this.onRightAllButtonPressed} disabled={!this.state.isRightAllActive}>{'>>'}</Button>
            ---
            <Button onClick={this.onLeftAllButtonPressed} disabled={!this.state.isLeftAllActive}>{'<<'}</Button>
            <Button onClick={this.onLeftButtonPressed} disabled={!this.state.isLeftActive}>{'<'}</Button>
          </ButtonGroup>
          <Column
            column={columns[rightColumnId]}
            items={getItems(columns, items, rightColumnId)}
            selectedItemIds={selectedItemIds}
            key={rightColumnId}
            draggingItemId={this.state.draggingItemId}
            toggleSelection={this.toggleSelection}
            toggleSelectionInGroup={this.toggleSelectionInGroup}
            multiSelectTo={this.multiSelectTo}
          />
        </Container>
      </DragDropContext>
    )
  }
}

PickList.propTypes = {
  formId: PropTypes.string,
  name: PropTypes.string,
  leftColumn: PropTypes.object.isRequired,
  rightColumn: PropTypes.object.isRequired,
  items: PropTypes.object.isRequired
};

export default connect()(PickList);
