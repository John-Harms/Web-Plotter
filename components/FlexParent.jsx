import React, { useState, useCallback, useRef, useEffect } from 'react';
import styles from "./FlexParent.module.css";
import hospitalMap from "../assets/images/StLukes.png"; // Assuming this is floor 1

function FlexParent() {
    const [dots, setDots] = useState({ 1: [], 2: [], 3: [] }); // Floor-specific dots
    const [connections, setConnections] = useState([]);
    const [selectedDotId, setSelectedDotId] = useState(null);
    const [renamingDotId, setRenamingDotId] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const wasDraggingRef = useRef(false);
    const [currentFloor, setCurrentFloor] = useState(1); // Current floor state
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, dotId: null }); // Context menu state

    const floorImages = {
      1: hospitalMap, // Assuming hospitalMap is still floor 1's image
      2: hospitalMap,
      3: hospitalMap
  };

    useEffect(() => {
        console.log(`Dots for Floor ${currentFloor} updated:`, dots[currentFloor]);
    }, [dots, currentFloor]);

    useEffect(() => {
        console.log("Connections updated:", connections);
    }, [connections]);


    const addDot = useCallback((x, y, floor) => { // Add floor parameter
        const id = Date.now();
        setDots(prevDots => ({
            ...prevDots,
            [floor]: [...prevDots[floor], { id, x, y, name: null, isRenaming: false, floor }], // Include floor in dot object
        }));
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


        const targetDot = dots[currentFloor].find(dot => { // Search within current floor dots
            if (dot.id === selectedDotId) return false;
            const distance = Math.sqrt(Math.pow(dot.x - releaseX, 2) + Math.pow(dot.y - releaseY, 2));
            return distance <= 20;
        });

        if (targetDot) {
            const startDot = dots[currentFloor].find(dot => dot.id === selectedDotId); // Find start dot in current floor
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
    }, [dots, connections, isDragging, selectedDotId, setConnections, setSelectedDotId, setIsDragging, currentFloor]); // currentFloor dependency added


    const handleImgBoundsMouseUp = useCallback((e) => {
        console.log("handleImgBoundsMouseUp - START - isDragging:", isDragging, "wasDraggingRef.current:", wasDraggingRef.current, "target:", e.target, "currentTarget:", e.currentTarget);

        const rect = e.currentTarget.getBoundingClientRect();
        const releaseX = e.clientX - rect.left;
        const releaseY = e.clientY - rect.top;

        if (wasDraggingRef.current) {
            stopDraggingAndConnect(releaseX, releaseY);
            console.log("handleImgBoundsMouseUp - Drag release flow completed");
        } else if (!isDragging) {
            console.log("handleImgBoundsMouseUp - Simple click - Adding dot");
            addDot(releaseX, releaseY, currentFloor); // Pass currentFloor here
        } else {
            console.log("handleImgBoundsMouseUp - MouseUp during drag, but not a release - should not happen in this logic");
        }

        console.log("handleImgBoundsMouseUp - END - isDragging:", isDragging, "wasDraggingRef.current:", wasDraggingRef.current);
    }, [stopDraggingAndConnect, addDot, isDragging, currentFloor]); // currentFloor dependency added


    const handleDotMouseDown = useCallback((e, dotId) => {
        e.stopPropagation();
        startDraggingDot(dotId);
    }, [startDraggingDot]);


    const handleDotClick = useCallback((e, dotId) => {
        e.stopPropagation();
        if (e.button === 2) { // Right-click
            e.preventDefault(); // Prevent default context menu
            setContextMenu({ visible: true, x: e.clientX, y: e.clientY, dotId: dotId });
        } else { // Left-click - initiate renaming
            setDots(prevDots => {
                const updatedDots = { ...prevDots };
                updatedDots[currentFloor] = updatedDots[currentFloor].map(dot =>
                    dot.id === dotId ? { ...dot, isRenaming: true } : { ...dot, isRenaming: false }
                );
                return updatedDots;
            });
        }
    }, [setDots, setContextMenu, currentFloor]);

    const isDotNameUnique = (name, currentDotId) => {
        return Object.values(dots).every(floorDots => // Iterate through all floors
            floorDots.every(dot => dot.id === currentDotId || dot.name !== name)
        );
    };

    const handleLinkFloors = useCallback(() => {
        if (!contextMenu.dotId) return;

        const checkedFloors = Array.from(document.querySelectorAll('#floorCheckbox:checked'))
            .map(checkbox => parseInt(checkbox.value, 10));

        checkedFloors.forEach(floor => {
            if (floor !== currentFloor) {
                const originalDot = dots[currentFloor].find(dot => dot.id === contextMenu.dotId);
                if (originalDot) {
                    const newDotId = Date.now() + floor; // Unique ID for new dot
                    setDots(prevDots => ({
                        ...prevDots,
                        [floor]: [...prevDots[floor], { id: newDotId, x: originalDot.x, y: originalDot.y, name: originalDot.name, isRenaming: false, floor, linkedDotId: contextMenu.dotId }],
                    }));
                    // Basic connection for cross floor, refine as needed for visual representation
                    setConnections(prevConnections => [...prevConnections, { dot1Id: contextMenu.dotId, dot2Id: newDotId, distance: 'Cross-Floor' }]);
                }
            }
        });
        setContextMenu({ ...contextMenu, visible: false }); // Close context menu after linking
    }, [contextMenu, currentFloor, dots, setDots, setConnections]);


    const closeContextMenu = useCallback(() => {
        setContextMenu({ ...contextMenu, visible: false });
    }, [setContextMenu, contextMenu]);


    return (
        <div> {/* Buttons are now OUTSIDE the container div */}
            <div>
                <button onClick={() => setCurrentFloor(1)}>Floor 1</button>
                <button onClick={() => setCurrentFloor(2)}>Floor 2</button>
                <button onClick={() => setCurrentFloor(3)}>Floor 3</button>
            </div>
            <h2>Current Floor: {currentFloor}</h2>

            <div className={styles.container}> {/* Container for image and bounds */}
                <img src={floorImages[currentFloor]} className={styles.img} alt={`Hospital Map Floor ${currentFloor}`} />
                <div
                    className={styles.imgBounds}
                    onMouseUp={handleImgBoundsMouseUp}
                    onContextMenu={(e) => e.preventDefault()} // Prevent default context menu on image bounds
                >
                    {dots[currentFloor].map((dot) => ( // Access dots for currentFloor
                        <div
                            key={dot.id}
                            className={styles.dot}
                            style={{
                                left: dot.x - 10,
                                top: dot.y - 10,
                                borderColor: dot.linkedDotId ? 'green' : 'blue', // Green border for linked dots (placeholder logic)
                                borderStyle: 'solid'
                            }}
                            onMouseDown={(e) => handleDotMouseDown(e, dot.id)}
                            draggable={false}
                            onContextMenu={(e) => handleDotClick(e, dot.id)} // Change to onContextMenu for right-click
                            onClick={(e) => handleDotClick(e, dot.id)} // Keep onClick for left-click renaming
                        >
                            {dot.isRenaming && (
                                <div className={styles.dotNameInputBox} style={{ top: '-30px', left: '-25px' }}>
                                    <input
                                        type="text"
                                        className={styles.dotNameInput}
                                        placeholder="Name"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const newName = e.target.value.trim();
                                                if (newName === "" || isDotNameUnique(newName, dot.id)) {
                                                    setDots(prevDots => {
                                                        const updatedDots = { ...prevDots };
                                                        updatedDots[currentFloor] = updatedDots[currentFloor].map(d =>
                                                            d.id === dot.id ? { ...d, name: newName, isRenaming: false } : d
                                                        );
                                                        return updatedDots;
                                                    });
                                                } else {
                                                    alert('Dot name must be unique across all floors.');
                                                    e.target.value = '';
                                                }
                                        }
                                    }}
                                    onBlur={() => setDots(prevDots => {
                                        const updatedDots = { ...prevDots };
                                        updatedDots[currentFloor] = updatedDots[currentFloor].map(dot => dot.id === dot.id ? { ...dot, isRenaming: false } : dot);
                                        return updatedDots;
                                    })}
                                    autoFocus
                                />
                            </div>
                        )}
                        {dot.name} {/* Display dot name if available */}
                    </div>
                ))}

                <svg className={styles.connectionCanvas}>
                    {connections.map((connection, index) => {
                        const dot1 = Object.values(dots).flat().find(dot => dot.id === connection.dot1Id); // Search dots across all floors
                        const dot2 = Object.values(dots).flat().find(dot => dot.id === connection.dot2Id); // Search dots across all floors

                        if (!dot1 || !dot2 || dot1.floor !== currentFloor || dot2.floor !== currentFloor) return null; // Only render connections within current floor

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
                {contextMenu.visible && (
                    <div
                        className={styles.contextMenu}
                        style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x }}
                        tabIndex="0"
                    >
                        <div className={styles.dotNameInputBox}>
                            <input
                                type="text"
                                className={styles.dotNameInput}
                                placeholder="Name"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const newName = e.target.value.trim();
                                        if (newName === "" || isDotNameUnique(newName, contextMenu.dotId)) {
                                            setDots(prevDots => {
                                                const updatedDots = { ...prevDots };
                                                updatedDots[currentFloor] = updatedDots[currentFloor].map(d =>
                                                    d.id === contextMenu.dotId ? { ...d, name: newName, isRenaming: false } : d
                                                );
                                                return updatedDots;
                                            });
                                            closeContextMenu(); // Close menu after naming
                                        } else {
                                            alert('Dot name must be unique across all floors.');
                                            e.target.value = '';
                                        }
                                    }
                                }}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label onClick={(e) => e.stopPropagation()}><input type="checkbox" id="floorCheckbox" value="1" defaultChecked={currentFloor === 1} onChange={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} /> Floor 1</label><br />
                            <label onClick={(e) => e.stopPropagation()}><input type="checkbox" id="floorCheckbox" value="2" onChange={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} /> Floor 2</label><br />
                            <label onClick={(e) => e.stopPropagation()}><input type="checkbox" id="floorCheckbox" value="3" onChange={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} /> Floor 3</label><br />
                        </div>
                        <button onClick={handleLinkFloors}>Link Floors</button>
                        <button onClick={closeContextMenu}>Close</button> {/* Added a close button for more control */}
                    </div>
                )}
            </div>
        </div>
      </div>
    );
}

export default FlexParent;