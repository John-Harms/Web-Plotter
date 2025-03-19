// FlexParent.jsx
import React, { useState, useCallback, useEffect } from "react";
import styles from "./FlexParent.module.css";
import hospitalMap from "../assets/images/StLukes.png";
import DotContextMenu from "./DotContextMenu";

function SimplifiedFlexParent() {
  // New state for active map.
  const [activeMap, setActiveMap] = useState("Map 1");

  const [dots, setDots] = useState([]);
  const [connections, setConnections] = useState([]);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    dotId: null,
    x: 0,
    y: 0,
  });

  useEffect(() => {
    console.log("Dots updated:", dots);
  }, [dots]);

  useEffect(() => {
    console.log("Connections updated:", connections);
  }, [connections]);

  // Global listener to close the context menu when clicking outside.
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false, dotId: null, x: 0, y: 0 });
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [contextMenu.visible]);

  // When a left-click occurs on the image, add a new dot on the current active map.
  const addDot = useCallback(
    (x, y, clientX, clientY) => {
      const id = Date.now();
      // Include the activeMap property for the dot.
      setDots((prevDots) => [
        ...prevDots,
        { id, x, y, name: "", isVisible: true, map: activeMap },
      ]);
      setContextMenu({ visible: true, dotId: id, x: clientX, y: clientY });
    },
    [activeMap]
  );

  const handleImgBoundsMouseUp = useCallback(
    (e) => {
      if (e.button !== 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      addDot(x, y, e.clientX, e.clientY);
    },
    [addDot]
  );

  // Update connection function to support cross-map connections.
  const addConnection = (id1, id2) => {
    if (
      !connections.some(
        (conn) =>
          (conn.dot1Id === id1 && conn.dot2Id === id2) ||
          (conn.dot1Id === id2 && conn.dot2Id === id1)
      )
    ) {
      const dot1 = dots.find((d) => d.id === id1);
      const dot2 = dots.find((d) => d.id === id2);
      if (dot1 && dot2) {
        let distance;
        // If on the same map, calculate Euclidean distance.
        if (dot1.map === dot2.map) {
          distance = Math.sqrt(
            Math.pow(dot1.x - dot2.x, 2) + Math.pow(dot1.y - dot2.y, 2)
          ).toFixed(2);
        } else {
          // For cross-map connections, use the absolute difference of the map numbers.
          const num1 = parseInt(dot1.map.split(" ")[1], 10);
          const num2 = parseInt(dot2.map.split(" ")[1], 10);
          distance = Math.abs(num1 - num2);
        }
        setConnections((prev) => [
          ...prev,
          { dot1Id: id1, dot2Id: id2, distance },
        ]);
      }
    }
  };

  // Filter visible dots and connections to show only items on the active map.
  const visibleDots = dots.filter((dot) => dot.map === activeMap);
  const visibleConnections = connections.filter((connection) => {
    const dot1 = dots.find((dot) => dot.id === connection.dot1Id);
    const dot2 = dots.find((dot) => dot.id === connection.dot2Id);
    return dot1 && dot2 && dot1.map === activeMap && dot2.map === activeMap;
  });

  const updateDotName = (id, newName) => {
    setDots((prevDots) =>
      prevDots.map((d) => (d.id === id ? { ...d, name: newName } : d))
    );
  };

  const updateDotVisibility = (id, visible) => {
    setDots((prevDots) =>
      prevDots.map((d) => (d.id === id ? { ...d, isVisible: visible } : d))
    );
  };

  const removeConnection = (id1, id2) => {
    setConnections((prev) =>
      prev.filter(
        (conn) =>
          !(
            (conn.dot1Id === id1 && conn.dot2Id === id2) ||
            (conn.dot1Id === id2 && conn.dot2Id === id1)
          )
      )
    );
  };

  const deleteDot = useCallback((id) => {
    console.log("Deleting dot with id", id);
    setDots((prevDots) => prevDots.filter((dot) => dot.id !== id));
    setConnections((prevConnections) =>
      prevConnections.filter((conn) => conn.dot1Id !== id && conn.dot2Id !== id)
    );
    setContextMenu({ visible: false, dotId: null, x: 0, y: 0 });
  }, []);

  const currentDot = dots.find((d) => d.id === contextMenu.dotId);

  return (
    <div>
      {/* Map Toggling UI */}
      <div className={styles.mapSwitcher}>
        <button onClick={() => setActiveMap("Map 1")}>Map 1</button>
        <button onClick={() => setActiveMap("Map 2")}>Map 2</button>
        <button onClick={() => setActiveMap("Map 3")}>Map 3</button>
      </div>
      <h2>Currently Viewing: {activeMap}</h2>
      <div className={styles.container}>
        <img src={hospitalMap} className={styles.img} alt="Hospital Map" />
        <div
          className={styles.imgBounds}
          onMouseUp={handleImgBoundsMouseUp}
          onContextMenu={(e) => e.preventDefault()}
        >
          {visibleDots.map((dot) => (
            <React.Fragment key={dot.id}>
              {dot.isVisible && (
                <div
                  className={styles.dotName}
                  style={{
                    left: dot.x,
                    top: dot.y - 30,
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
                onClick={(e) => {
                  e.stopPropagation();
                  setContextMenu({
                    visible: true,
                    dotId: dot.id,
                    x: e.clientX,
                    y: e.clientY,
                  });
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                draggable={false}
              />
            </React.Fragment>
          ))}
          <svg className={styles.connectionCanvas}>
            {visibleConnections.map((connection, index) => {
              const dot1 = dots.find((dot) => dot.id === connection.dot1Id);
              const dot2 = dots.find((dot) => dot.id === connection.dot2Id);
              if (!dot1 || !dot2) return null;
              return (
                <line
                  key={index}
                  x1={dot1.x}
                  y1={dot1.y}
                  x2={dot2.x}
                  y2={dot2.y}
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
          updateDotVisibility={updateDotVisibility}
          addConnection={addConnection}
          removeConnection={removeConnection}
          deleteDot={deleteDot}
          onClose={() =>
            setContextMenu({ visible: false, dotId: null, x: 0, y: 0 })
          }
          position={{ x: contextMenu.x, y: contextMenu.y }}
        />
      )}
    </div>
  );
}

export default SimplifiedFlexParent;
