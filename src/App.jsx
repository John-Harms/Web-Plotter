import React, { useState } from 'react';
import './App.css';

const SiblingComponent = ({ columnIndex, rowIndex, key }) => {
  return (
    <div className="sibling-item">
      Sibling
      <br />
      Key: {key}
      <br />
      Col: {columnIndex}, Row: {rowIndex} {/* Optional: Displaying indices */}
    </div>
  );
};

const GridContainer = () => {
  const [numberOfSiblings, setNumberOfSiblings] = useState(100);

  const siblings = Array.from({ length: numberOfSiblings }, (_, index) => {
    // Calculate column and row index
    const columnIndex = index % 10; // Column index (0, 1, 2, 3, 0, 1...)
    const rowIndex = Math.floor((numberOfSiblings / 10) - .0001) - Math.floor(index / 10); // Row index (0, 0, 0, 0, 1, 1...)

    // Create the key in "column,row" format
    const key = `${columnIndex},${rowIndex}`;

    return (
      <SiblingComponent
        key={key} // Set the generated key
        columnIndex={columnIndex} // Optional: Pass column index as prop
        rowIndex={rowIndex}     // Optional: Pass row index as prop
      />
    );
  });

  return (
    <div className="grid-container">
      {siblings}
    </div>
  );
};

export default GridContainer;