// DotContextMenu.jsx
import React, { useState, useRef } from 'react';
import styles from "./FlexParent.module.css";

function DotContextMenu({ 
  dot, 
  allDots, 
  connections, 
  updateDotName, 
  updateDotVisibility,  // new prop for visibility update
  addConnection, 
  removeConnection, 
  deleteDot,   // new prop to handle deletion
  onClose,     // callback to close the GUI
  position 
}) {
  const [name, setName] = useState(dot.name || "");
  const [showDropdown, setShowDropdown] = useState(false);
  const [filter, setFilter] = useState("");
  const menuRef = useRef();

  const handleMenuClick = (e) => {
    e.stopPropagation();
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const handleNameBlur = () => {
    updateDotName(dot.id, name);
  };

  // Filter out the current dot and dots that do not match the filter.
  const filteredDots = allDots.filter(d => 
    d.id !== dot.id && d.name.toLowerCase().includes(filter.toLowerCase())
  );

  // Determine dots connected to the current dot.
  const connectedDots = connections.filter(conn => 
    conn.dot1Id === dot.id || conn.dot2Id === dot.id
  ).map(conn => {
    return allDots.find(d => d.id === (conn.dot1Id === dot.id ? conn.dot2Id : conn.dot1Id));
  }).filter(d => d);

  return (
    <div 
      className={styles.contextMenu} 
      style={{ position: "absolute", left: position.x, top: position.y }} 
      ref={menuRef} 
      onClick={handleMenuClick}
    >
      <div>
        <label>Dot Name:</label>
        <input 
          type="text" 
          value={name} 
          onChange={handleNameChange} 
          onBlur={handleNameBlur} 
          className={styles.dotNameInput} 
          autoFocus 
        />
      </div>
      {/* New checkbox for controlling dot name visibility */}
      <div>
        <label>
          <input 
            type="checkbox" 
            checked={dot.isVisible} 
            onChange={(e) => updateDotVisibility(dot.id, e.target.checked)} 
            className={styles.checkbox}
          />
          Show Name
        </label>
      </div>
      <div>
        <button onClick={(e) => { 
          e.stopPropagation(); 
          setShowDropdown(!showDropdown); 
        }}>
          Add Connection
        </button>
        {showDropdown && (
          <div>
            <input 
              type="text" 
              placeholder="Filter dots" 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)} 
            />
            <ul>
              {filteredDots.map(d => (
                <li key={d.id} onClick={(e) => { 
                  e.stopPropagation(); 
                  addConnection(dot.id, d.id); 
                  setShowDropdown(false);
                }}>
                  {d.name || `Dot ${d.id}`}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div>
        <label>Connected Dots:</label>
        <ul>
          {connectedDots.map(d => (
            <li key={d.id}>
              {d.name || `Dot ${d.id}`} 
              <button onClick={(e) => { 
                e.stopPropagation(); 
                removeConnection(dot.id, d.id);
              }}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
      {/* New buttons to close the GUI and to delete the dot */}
      <div style={{ marginTop: "10px", display: "flex", justifyContent: "space-between" }}>
        <button onClick={(e) => { 
          e.stopPropagation(); 
          onClose(); 
        }}>
          Close
        </button>
        <button onClick={(e) => {
          e.stopPropagation();
          deleteDot(dot.id);
        }}>
          Delete Dot
        </button>
      </div>
    </div>
  );
}

export default DotContextMenu;
