import React, { useState, useCallback, useRef } from 'react';
import styles from "./FlexParent.module.css";
import hospitalMap from "../assets/images/StLukes.png";

function FlexParent() {
  const [dots, setDots] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedDotId, setSelectedDotId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const wasDraggingRef = useRef(false);

  const addDot = useCallback((x, y) => {
    const id = Date.now();
    setDots((prevDots) => [...prevDots, { id, x, y }]);
  }, [setDots]);

  const startDraggingDot = useCallback((dotId) => {
    console.log("handleDotMouseDown - dotId:", dotId, "isDragging:", isDragging, "wasDraggingRef.current:", wasDraggingRef.current);
    setSelectedDotId(dotId);
    setIsDragging(true);
    wasDraggingRef.current = true;
  }, [setSelectedDotId, setIsDragging, isDragging]);

  const stopDraggingAndConnect = useCallback((releaseX, releaseY) => {
    console.log("handleImgBoundsMouseUp - releaseX:", releaseX, "releaseY:", releaseY, "isDragging:", isDragging, "wasDraggingRef.current:", wasDraggingRef.current, "selectedDotId:", selectedDotId);
    if (!isDragging || selectedDotId === null) {
      setIsDragging(false);
      setSelectedDotId(null);
      wasDraggingRef.current = false;
      console.log("handleImgBoundsMouseUp - Early return - !isDragging or !selectedDotId. isDragging:", isDragging, "selectedDotId:", selectedDotId);
      return;
    }

    setIsDragging(false);
    wasDraggingRef.current = false;
    console.log("handleImgBoundsMouseUp - Dragging stopped, wasDraggingRef reset. isDragging:", isDragging, "wasDraggingRef.current:", wasDraggingRef.current);


    const targetDot = dots.find(dot => {
      if (dot.id === selectedDotId) return false;
      const distance = Math.sqrt(Math.pow(dot.x - releaseX, 2) + Math.pow(dot.y - releaseY, 2));
      return distance <= 20;
    });

    if (targetDot) {
      const startDot = dots.find(dot => dot.id === selectedDotId);
      if (startDot) {
        const connectionExists = connections.some(conn =>
          (conn.dot1Id === selectedDotId && conn.dot2Id === targetDot.id) ||
          (conn.dot1Id === targetDot.id && conn.dot2Id === selectedDotId)
        );

        if (!connectionExists) {
          const distance = Math.sqrt(Math.pow(targetDot.x - startDot.x, 2) + Math.pow(targetDot.y - startDot.y, 2));
          const newConnection = {
            dot1Id: selectedDotId,
            dot2Id: targetDot.id,
            distance: distance.toFixed(2),
          };
          setConnections([...connections, newConnection]);
        }
      }
    }
    setSelectedDotId(null);
  }, [dots, connections, isDragging, selectedDotId, setConnections, setSelectedDotId, setIsDragging]);

  // **Removed handleClick and moved dot placement logic to handleImgBoundsMouseUp**
  const handleImgBoundsMouseUp = useCallback((e) => {
    console.log("handleImgBoundsMouseUp - START - isDragging:", isDragging, "wasDraggingRef.current:", wasDraggingRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    const releaseX = e.clientX - rect.left;
    const releaseY = e.clientY - rect.top;

    if (wasDraggingRef.current) {
      stopDraggingAndConnect(releaseX, releaseY);
      console.log("handleImgBoundsMouseUp - Drag release flow completed");
    } else if (!isDragging) { // Only add a dot if NOT dragging and NOT wasDragging (simple click)
      console.log("handleImgBoundsMouseUp - Simple click - Adding dot");
      addDot(releaseX, releaseY);
    } else {
      console.log("handleImgBoundsMouseUp - MouseUp during drag, but not a release - should not happen in this logic"); // Should ideally not reach here
    }
    console.log("handleImgBoundsMouseUp - END - isDragging:", isDragging, "wasDraggingRef.current:", wasDraggingRef.current);
  }, [stopDraggingAndConnect, addDot, isDragging]); // isDragging added as dependency


  const handleDotMouseDown = useCallback((e, dotId) => {
    e.stopPropagation();
    startDraggingDot(dotId);
  }, [startDraggingDot]);


  return (
    <div className={styles.container}>
      <img src={hospitalMap} className={styles.img} alt="Hospital Map" />
      <div
        className={styles.imgBounds}
        // **Removed onClick from imgBounds**
        onMouseUp={handleImgBoundsMouseUp} // Now using onMouseUp for everything
      >
        {dots.map((dot) => (
          <div
            key={dot.id}
            className={styles.dot}
            style={{ left: dot.x - 10, top: dot.y - 10 }}
            onMouseDown={(e) => handleDotMouseDown(e, dot.id)}
            draggable={false}
          ></div>
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
  );
}

export default FlexParent;