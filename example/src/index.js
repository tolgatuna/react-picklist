import React from 'react'
import ReactDOM from 'react-dom'
import initialData from './initialData'
import PickList from 'react-picklist'

class App extends React.Component {
  state = initialData;

  render() {
    return <PickList
      leftColumn={this.state.columns['1']}
      rightColumn={this.state.columns['2']}
      items={this.state.items}
    />
  }
}

ReactDOM.render(<App/>, document.getElementById('root'));
