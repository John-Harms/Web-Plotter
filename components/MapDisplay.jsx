// components/MapDisplay.jsx
import React from 'react';
import styles from './MapDisplay.module.css';

function MapDisplay({
  activeMap,
  hospitalMap,
  handleImgBoundsMouseUp,
  visibleDots,
  visibleConnections,
  dots,
  connections,
  contextMenu, // included for future use if needed
  setContextMenu,
  currentDot, // included for future use if needed
  updateDotName, // included for future use if needed
  updateDotVisibility, // included for future use if needed
  addConnection, // included for future use if needed
  removeConnection, // included for future use if needed
  deleteDot, // included for future use if needed
}) {
  return (
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
  );
}

export default MapDisplay;
