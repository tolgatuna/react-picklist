# react-picklist

> React Picklist Component

[![NPM](https://img.shields.io/npm/v/react-picklist.svg)](https://www.npmjs.com/package/react-picklist) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save react-picklist
```

## Usage

```jsx
import React, { Component } from 'react'

import PickList from 'react-picklist'

class Example extends Component {
  render () {
    return (
      <PickList
          leftColumn={this.state.columns['1']}
          rightColumn={this.state.columns['2']}
          items={this.state.items}
      />
    )
  }
}
```

## License

MIT © [tolgatuna](https://github.com/tolgatuna)
