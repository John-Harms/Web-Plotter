// FlexParent.jsx
import React, { useState, useCallback, useEffect } from 'react';
import styles from "./FlexParent.module.css";
import hospitalMap from "../assets/images/StLukes.png";
import DotContextMenu from "./DotContextMenu";

function SimplifiedFlexParent() {
  const [dots, setDots] = useState([]);
  const [connections, setConnections] = useState([]);
  // contextMenu state holds whether a dot’s menu is open, which dot, and its screen position.
  const [contextMenu, setContextMenu] = useState({ visible: false, dotId: null, x: 0, y: 0 });

  useEffect(() => {
    console.log("Dots updated:", dots);
  }, [dots]);

  useEffect(() => {
    console.log("Connections updated:", connections);
  }, [connections]);

  // Global listener: clicking anywhere (outside the context menu) closes the menu.
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false, dotId: null, x: 0, y: 0 });
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [contextMenu.visible]);

  // When a left-click occurs on the image, add a new dot and open its context menu for naming.
  const addDot = useCallback((x, y, clientX, clientY) => {
    const id = Date.now();
    // Added isVisible property here
    setDots(prevDots => ([...prevDots, { id, x, y, name: "", isVisible: true }]));
    setContextMenu({ visible: true, dotId: id, x: clientX, y: clientY });
  }, []);

  const handleImgBoundsMouseUp = useCallback((e) => {
    // Only respond to left-click (button 0)
    if (e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    addDot(x, y, e.clientX, e.clientY);
  }, [addDot]);

  // When a dot is right-clicked, open its context menu.
  const handleDotContextMenu = useCallback((e, dotId) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ visible: true, dotId, x: e.clientX, y: e.clientY });
  }, []);

  // Update dot name in state.
  const updateDotName = (id, newName) => {
    setDots(prevDots => prevDots.map(d => d.id === id ? { ...d, name: newName } : d));
  };

  // New function to update dot visibility.
  const updateDotVisibility = (id, visible) => {
    setDots(prevDots => prevDots.map(d => d.id === id ? { ...d, isVisible: visible } : d));
  };

  // Add connection if it does not already exist.
  const addConnection = (id1, id2) => {
    if (!connections.some(conn =>
         (conn.dot1Id === id1 && conn.dot2Id === id2) ||
         (conn.dot1Id === id2 && conn.dot2Id === id1)
       )) {
      const dot1 = dots.find(d => d.id === id1);
      const dot2 = dots.find(d => d.id === id2);
      if (dot1 && dot2) {
        const distance = Math.sqrt(Math.pow(dot1.x - dot2.x, 2) + Math.pow(dot1.y - dot2.y, 2)).toFixed(2);
        setConnections(prev => [...prev, { dot1Id: id1, dot2Id: id2, distance }]);
      }
    }
  };

  // Remove connection between two dots.
  const removeConnection = (id1, id2) => {
    setConnections(prev => prev.filter(conn => 
      !((conn.dot1Id === id1 && conn.dot2Id === id2) || (conn.dot1Id === id2 && conn.dot2Id === id1))
    ));
  };

  // Delete a dot and all its associated connections.
  const deleteDot = useCallback((id) => {
    console.log("Deleting dot with id", id);
    setDots(prevDots => prevDots.filter(dot => dot.id !== id));
    setConnections(prevConnections =>
      prevConnections.filter(conn => conn.dot1Id !== id && conn.dot2Id !== id)
    );
    // Close the context menu after deletion.
    setContextMenu({ visible: false, dotId: null, x: 0, y: 0 });
  }, []);

  // Find the dot for which the context menu is open.
  const currentDot = dots.find(d => d.id === contextMenu.dotId);

  return (
    <div>
      <div className={styles.container}>
        <img src={hospitalMap} className={styles.img} alt="Hospital Map" />
        <div
          className={styles.imgBounds}
          onMouseUp={handleImgBoundsMouseUp}
          onContextMenu={(e) => e.preventDefault()}
        >
          {dots.map((dot) => (
            <React.Fragment key={dot.id}>
              {/* Conditionally render dot name above the dot if isVisible is true */}
              {dot.isVisible && (
                <div 
                  className={styles.dotName} 
                  style={{
                    left: dot.x,
                    top: dot.y - 30, // adjust vertical offset as needed
                  }}
                >
                  {dot.name}
                </div>
              )}
              <div
                className={styles.dot}
                style={{
                  left: dot.x - 10,
                  top: dot.y - 10,
                }}
                onContextMenu={(e) => handleDotContextMenu(e, dot.id)}
                draggable={false}
              />
            </React.Fragment>
          ))}

          <svg className={styles.connectionCanvas}>
            {connections.map((connection, index) => {
              const dot1 = dots.find(dot => dot.id === connection.dot1Id);
              const dot2 = dots.find(dot => dot.id === connection.dot2Id);
              if (!dot1 || !dot2) return null;
              return (
                <line
                  key={index}
                  x1={dot1.x} y1={dot1.y}
                  x2={dot2.x} y2={dot2.y}
                  stroke="black"
                  strokeWidth="4"
                />
              );
            })}
          </svg>
        </div>
      </div>
      {contextMenu.visible && currentDot && (
        <DotContextMenu 
          dot={currentDot}
          allDots={dots}
          connections={connections}
          updateDotName={updateDotName}
          updateDotVisibility={updateDotVisibility}  /* Pass down the new function */
          addConnection={addConnection}
          removeConnection={removeConnection}
          deleteDot={deleteDot}  // Passing the delete function to the context menu.
          onClose={() => setContextMenu({ visible: false, dotId: null, x: 0, y: 0 })}
          position={{ x: contextMenu.x, y: contextMenu.y }}
        />
      )}
    </div>
  );
}

export default SimplifiedFlexParent;
