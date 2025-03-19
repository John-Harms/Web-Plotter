// FlexParent.jsx (updated)
import React, { useState, useCallback, useEffect, useMemo } from "react";
import styles from "./FlexParent.module.css";
import hospitalMap from "../assets/images/StLukes.png";
import DotContextMenu from "./DotContextMenu";

function FlexParent() {
  const [activeMap, setActiveMap] = useState("Map 1");
  const [dots, setDots] = useState([]);
  const [connections, setConnections] = useState([]);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    dotId: null,
    x: 0,
    y: 0,
  });
  const [connectionsVisible, setConnectionsVisible] = useState(true);

  // Update cross-map connections when connections change.
  const updateCrossMapConnections = useCallback(() => {
    setDots(prevDots => {
      const clearedDots = prevDots.map(dot => ({ ...dot, isCrossMapConnected: false }));
      const crossConnectedIds = new Set();
      connections.forEach(conn => {
        const dot1 = clearedDots.find(d => d.id === conn.dot1Id);
        const dot2 = clearedDots.find(d => d.id === conn.dot2Id);
        if (dot1 && dot2 && dot1.map !== dot2.map) {
          crossConnectedIds.add(dot1.id);
          crossConnectedIds.add(dot2.id);
        }
      });
      return clearedDots.map(dot =>
        crossConnectedIds.has(dot.id)
          ? { ...dot, isCrossMapConnected: true }
          : dot
      );
    });
  }, [connections]);

  useEffect(() => {
    updateCrossMapConnections();
  }, [connections, updateCrossMapConnections]);

  useEffect(() => {
    console.log("Dots updated:", dots);
  }, [dots]);

  useEffect(() => {
    console.log("Connections updated:", connections);
  }, [connections]);

  // Global click listener to close the context menu.
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false, dotId: null, x: 0, y: 0 });
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [contextMenu.visible]);

  // Add Dot with the new isShown property
  const addDot = useCallback((x, y, clientX, clientY) => {
    const id = Date.now();
    setDots(prev => [
      ...prev,
      {
        id,
        x,
        y,
        name: "",
        isVisible: true,
        map: activeMap,
        isCrossMapConnected: false,
        isShown: true // New property added here.
      }
    ]);
    setContextMenu({ visible: true, dotId: id, x: clientX, y: clientY });
  }, [activeMap]);

  const handleImgBoundsMouseUp = useCallback((e) => {
    if (e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    addDot(x, y, e.clientX, e.clientY);
  }, [addDot]);

  const addConnection = (id1, id2) => {
    if (connections.some(conn =>
      (conn.dot1Id === id1 && conn.dot2Id === id2) ||
      (conn.dot1Id === id2 && conn.dot2Id === id1)
    )) return;

    const dot1 = dots.find(d => d.id === id1);
    const dot2 = dots.find(d => d.id === id2);
    if (dot1 && dot2) {
      const distance = dot1.map === dot2.map
        ? Math.hypot(dot1.x - dot2.x, dot1.y - dot2.y).toFixed(2)
        : Math.abs(
            parseInt(dot1.map.split(" ")[1], 10) -
            parseInt(dot2.map.split(" ")[1], 10)
          );
      setConnections(prev => [
        ...prev,
        { dot1Id: id1, dot2Id: id2, distance, isVisible: connectionsVisible }
      ]);
    }
  };

  // Only render dots that belong to the active map AND have isShown true
  const visibleDots = useMemo(
    () => dots.filter(dot => dot.map === activeMap && dot.isShown),
    [dots, activeMap]
  );

  const visibleConnections = useMemo(() => 
    connections.filter(connection => {
      const dot1 = dots.find(dot => dot.id === connection.dot1Id);
      const dot2 = dots.find(dot => dot.id === connection.dot2Id);
      return dot1 && dot2 && dot1.map === activeMap && dot2.map === activeMap;
    }), 
    [connections, dots, activeMap]
  );

  const updateDotName = (id, newName) => {
    setDots(prev => prev.map(dot => dot.id === id ? { ...dot, name: newName } : dot));
  };

  const updateDotVisibility = (id, visible) => {
    setDots(prev => prev.map(dot => dot.id === id ? { ...dot, isVisible: visible } : dot));
  };

  const removeConnection = (id1, id2) => {
    setConnections(prev =>
      prev.filter(conn =>
        !((conn.dot1Id === id1 && conn.dot2Id === id2) ||
          (conn.dot1Id === id2 && conn.dot2Id === id1))
      )
    );
  };

  const deleteDot = useCallback((id) => {
    setDots(prev => prev.filter(dot => dot.id !== id));
    setConnections(prev =>
      prev.filter(conn => conn.dot1Id !== id && conn.dot2Id !== id)
    );
    setContextMenu({ visible: false, dotId: null, x: 0, y: 0 });
  }, []);

  const handleToggleConnections = () => {
    setConnectionsVisible(prev => {
      const newVisibility = !prev;
      setConnections(conns =>
        conns.map(conn => ({ ...conn, isVisible: newVisibility }))
      );
      return newVisibility;
    });
  };

  // New function to toggle the isShown property for all dots.
  const handleToggleDotsVisibility = () => {
    setDots(prevDots => prevDots.map(dot => ({
      ...dot,
      isShown: !dot.isShown
    })));
  };

  const currentDot = dots.find(d => d.id === contextMenu.dotId);

  return (
    <div>
      <div className={styles.mapSwitcher}>
        <button onClick={() => setActiveMap("Map 1")}>Map 1</button>
        <button onClick={() => setActiveMap("Map 2")}>Map 2</button>
        <button onClick={() => setActiveMap("Map 3")}>Map 3</button>
        <button onClick={handleToggleConnections}>Toggle Connections</button>
        {/* New Toggle Dots Visibility button */}
        <button onClick={handleToggleDotsVisibility}>Toggle Dots Visibility</button>
      </div>
      <h2>Currently Viewing: {activeMap}</h2>
      <div className={styles.container}>
        <img src={hospitalMap} className={styles.img} alt="Hospital Map" />
        <div
          className={styles.imgBounds}
          onMouseUp={handleImgBoundsMouseUp}
          onContextMenu={(e) => e.preventDefault()}
        >
          {visibleDots.map(dot => {
            const crossMapVisible = connections.some(conn => {
              if (conn.isVisible) {
                const otherDot = dot.id === conn.dot1Id
                  ? dots.find(d => d.id === conn.dot2Id)
                  : dots.find(d => d.id === conn.dot1Id);
                return otherDot && dot.map !== otherDot.map;
              }
              return false;
            });
            const showGreenBorder = dot.isCrossMapConnected && crossMapVisible;
            return (
              <React.Fragment key={dot.id}>
                {dot.isVisible && (
                  <div
                    className={styles.dotName}
                    style={{ left: dot.x, top: dot.y - 30 }}
                  >
                    {dot.name}
                  </div>
                )}
                <div
                  className={`${styles.dot} ${showGreenBorder ? styles.crossMapConnectedDot : ""}`}
                  style={{ left: dot.x - 10, top: dot.y - 10 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setContextMenu({ visible: true, dotId: dot.id, x: e.clientX, y: e.clientY });
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  draggable={false}
                />
              </React.Fragment>
            );
          })}
          <svg className={styles.connectionCanvas}>
            {visibleConnections.map((connection, index) => {
              if (!connection.isVisible) return null;
              const dot1 = dots.find(dot => dot.id === connection.dot1Id);
              const dot2 = dots.find(dot => dot.id === connection.dot2Id);
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

export default FlexParent;
