// components/FlexParent.jsx
import React, { useState, useCallback, useEffect, useMemo } from "react";
import styles from "./FlexParent.module.css";
import hospitalMap from "../assets/images/StLukes.png";
import DotContextMenu from "./DotContextMenu";
import MapDisplay from "./MapDisplay";

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

  // New state variables for pathfinding dropdowns.
  const [startDotId, setStartDotId] = useState("");
  const [endDotId, setEndDotId] = useState("");

  // Update cross-map connections when connections change.
  const updateCrossMapConnections = useCallback(() => {
    setDots((prevDots) => {
      const clearedDots = prevDots.map((dot) => ({ ...dot, isCrossMapConnected: false }));
      const crossConnectedIds = new Set();
      connections.forEach((conn) => {
        const dot1 = clearedDots.find((d) => d.id === conn.dot1Id);
        const dot2 = clearedDots.find((d) => d.id === conn.dot2Id);
        if (dot1 && dot2 && dot1.map !== dot2.map) {
          crossConnectedIds.add(dot1.id);
          crossConnectedIds.add(dot2.id);
        }
      });
      return clearedDots.map((dot) =>
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

  // Add Dot with the new isShown property.
  const addDot = useCallback(
    (x, y, clientX, clientY) => {
      const id = Date.now();
      setDots((prev) => [
        ...prev,
        {
          id,
          x,
          y,
          name: "",
          isVisible: true,
          map: activeMap,
          isCrossMapConnected: false,
          isShown: true, // Default behavior remains.
        },
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

  const addConnection = (id1, id2) => {
    if (
      connections.some(
        (conn) =>
          (conn.dot1Id === id1 && conn.dot2Id === id2) ||
          (conn.dot1Id === id2 && conn.dot2Id === id1)
      )
    )
      return;

    const dot1 = dots.find((d) => d.id === id1);
    const dot2 = dots.find((d) => d.id === id2);
    if (dot1 && dot2) {
      const distance =
        dot1.map === dot2.map
          ? Math.hypot(dot1.x - dot2.x, dot1.y - dot2.y).toFixed(2)
          : Math.abs(
              parseInt(dot1.map.split(" ")[1], 10) -
                parseInt(dot2.map.split(" ")[1], 10)
            );
      setConnections((prev) => [
        ...prev,
        { dot1Id: id1, dot2Id: id2, distance, isVisible: connectionsVisible },
      ]);
    }
  };

  // Only render dots that belong to the active map AND have isShown true.
  const visibleDots = useMemo(
    () => dots.filter((dot) => dot.map === activeMap && dot.isShown),
    [dots, activeMap]
  );

  const visibleConnections = useMemo(
    () =>
      connections.filter((connection) => {
        const dot1 = dots.find((dot) => dot.id === connection.dot1Id);
        const dot2 = dots.find((dot) => dot.id === connection.dot2Id);
        return dot1 && dot2 && dot1.map === activeMap && dot2.map === activeMap;
      }),
    [connections, dots, activeMap]
  );

  const updateDotName = (id, newName) => {
    setDots((prev) =>
      prev.map((dot) => (dot.id === id ? { ...dot, name: newName } : dot))
    );
  };

  const updateDotVisibility = (id, visible) => {
    setDots((prev) =>
      prev.map((dot) => (dot.id === id ? { ...dot, isVisible: visible } : dot))
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
    setDots((prev) => prev.filter((dot) => dot.id !== id));
    setConnections((prev) =>
      prev.filter((conn) => conn.dot1Id !== id && conn.dot2Id !== id)
    );
    setContextMenu({ visible: false, dotId: null, x: 0, y: 0 });
  }, []);

  const handleToggleConnections = () => {
    setConnectionsVisible((prev) => {
      const newVisibility = !prev;
      setConnections((conns) =>
        conns.map((conn) => ({ ...conn, isVisible: newVisibility }))
      );
      return newVisibility;
    });
  };

  // New function to toggle the isShown property for all dots.
  const handleToggleDotsVisibility = () => {
    setDots((prevDots) =>
      prevDots.map((dot) => ({
        ...dot,
        isShown: !dot.isShown,
      }))
    );
  };

  const currentDot = dots.find((d) => d.id === contextMenu.dotId);

  // NEW: Dijkstra's algorithm implementation.
  const findPath = (startId, endId) => {
    // Ensure we have valid start and end dots.
    const startDot = dots.find((d) => d.id === parseInt(startId));
    const endDot = dots.find((d) => d.id === parseInt(endId));
    if (!startDot || !endDot) return null;

    const distances = {};
    const previous = {};
    dots.forEach((dot) => {
      distances[dot.id] = dot.id === startDot.id ? 0 : Infinity;
      previous[dot.id] = null;
    });

    const unvisited = new Set(dots.map((dot) => dot.id));

    while (unvisited.size > 0) {
      let currentId = null;
      unvisited.forEach((id) => {
        if (currentId === null || distances[id] < distances[currentId]) {
          currentId = id;
        }
      });

      // Terminate early if we reached the destination.
      if (currentId === endDot.id) break;
      unvisited.delete(currentId);

      connections.forEach((conn) => {
        if (conn.dot1Id === currentId || conn.dot2Id === currentId) {
          const neighborId = conn.dot1Id === currentId ? conn.dot2Id : conn.dot1Id;
          if (!unvisited.has(neighborId)) return;

          const currentNode = dots.find((d) => d.id === currentId);
          const neighborNode = dots.find((d) => d.id === neighborId);
          let cost;
          if (currentNode.map === neighborNode.map) {
            cost = Math.hypot(currentNode.x - neighborNode.x, currentNode.y - neighborNode.y);
          } else {
            cost = Math.abs(
              parseInt(currentNode.map.split(" ")[1], 10) -
                parseInt(neighborNode.map.split(" ")[1], 10)
            );
          }
          const newDist = distances[currentId] + cost;
          if (newDist < distances[neighborId]) {
            distances[neighborId] = newDist;
            previous[neighborId] = currentId;
          }
        }
      });
    }

    if (distances[endDot.id] === Infinity) return null;

    const path = [];
    let curr = endDot.id;
    while (curr !== null) {
      path.unshift(curr);
      curr = previous[curr];
    }
    return path;
  };

  // NEW: Handler for the "Find Path" button.
  const handleFindPath = () => {
    if (!startDotId || !endDotId) {
      alert("Please select both start and end dots.");
      return;
    }
    const path = findPath(startDotId, endDotId);
    if (!path) {
      alert("No path found between the selected dots.");
      return;
    }
    // Update dot visibility: Make dots on the path visible.
    setDots((prevDots) =>
      prevDots.map((dot) => {
        if (path.includes(dot.id)) {
          return { ...dot, isVisible: true, isShown: true };
        }
        return dot;
      })
    );
    // Update connection visibility: Make connections visible if both endpoints are in the path.
    setConnections((prevConnections) =>
      prevConnections.map((conn) => {
        if (path.includes(conn.dot1Id) && path.includes(conn.dot2Id)) {
          return { ...conn, isVisible: true };
        }
        return conn;
      })
    );
  };

  return (
    <div>
      <div className={styles.mapSwitcher}>
        <button onClick={() => setActiveMap("Map 1")}>Map 1</button>
        <button onClick={() => setActiveMap("Map 2")}>Map 2</button>
        <button onClick={() => setActiveMap("Map 3")}>Map 3</button>
        <button onClick={handleToggleConnections}>Toggle Connections</button>
        <button onClick={handleToggleDotsVisibility}>Toggle Dots Visibility</button>

        {/* New UI Elements for Pathfinding */}
        <div style={{ marginTop: "10px" }}>
          <label htmlFor="start-dot-select">Start Dot: </label>
          <select
            id="start-dot-select"
            value={startDotId}
            onChange={(e) => setStartDotId(e.target.value)}
          >
            <option value="">Select Start Dot</option>
            {dots.map((dot) => (
              <option key={dot.id} value={dot.id}>
                {dot.name ? dot.name : `Dot ${dot.id}`}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginTop: "10px" }}>
          <label htmlFor="end-dot-select">End Dot: </label>
          <select
            id="end-dot-select"
            value={endDotId}
            onChange={(e) => setEndDotId(e.target.value)}
          >
            <option value="">Select End Dot</option>
            {dots.map((dot) => (
              <option key={dot.id} value={dot.id}>
                {dot.name ? dot.name : `Dot ${dot.id}`}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginTop: "10px" }}>
          <button onClick={handleFindPath}>Find Path</button>
        </div>
      </div>
      <h2>Currently Viewing: {activeMap}</h2>

      <MapDisplay
        activeMap={activeMap}
        hospitalMap={hospitalMap}
        handleImgBoundsMouseUp={handleImgBoundsMouseUp}
        visibleDots={visibleDots}
        visibleConnections={visibleConnections}
        dots={dots}
        connections={connections}
        contextMenu={contextMenu}
        setContextMenu={setContextMenu}
        currentDot={currentDot}
        updateDotName={updateDotName}
        updateDotVisibility={updateDotVisibility}
        addConnection={addConnection}
        removeConnection={removeConnection}
        deleteDot={deleteDot}
      />

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
