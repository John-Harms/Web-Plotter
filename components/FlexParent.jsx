import React, { useState, useCallback, useRef, useEffect } from 'react';
import styles from "./FlexParent.module.css";
import hospitalMap from "../assets/images/StLukes.png"; // Assuming this is floor 1

function SimplifiedFlexParent() {
    const [dots, setDots] = useState([]);
    const [connections, setConnections] = useState([]);
    const [selectedDotId, setSelectedDotId] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const wasDraggingRef = useRef(false);

    useEffect(() => {
        console.log("Dots updated:", dots);
    }, [dots]);

    useEffect(() => {
        console.log("Connections updated:", connections);
    }, [connections]);


    const addDot = useCallback((x, y) => {
        const id = Date.now();
        setDots(prevDots => ([...prevDots, { id, x, y }]));
    }, [setDots]);

    const startDraggingDot = useCallback((dotId) => {
        setSelectedDotId(dotId);
        setIsDragging(true);
        wasDraggingRef.current = true;
    }, [setSelectedDotId, setIsDragging, isDragging]);

    const stopDraggingAndConnect = useCallback((releaseX, releaseY) => {
        if (!isDragging || selectedDotId === null) {
            setIsDragging(false);
            setSelectedDotId(null);
            wasDraggingRef.current = false;
            return;
        }

        setIsDragging(false);
        wasDraggingRef.current = false;

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


    const handleImgBoundsMouseUp = useCallback((e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const releaseX = e.clientX - rect.left;
        const releaseY = e.clientY - rect.top;

        if (wasDraggingRef.current) {
            stopDraggingAndConnect(releaseX, releaseY);
        } else if (!isDragging) {
            addDot(releaseX, releaseY);
        }
    }, [stopDraggingAndConnect, addDot, isDragging]);


    const handleDotMouseDown = useCallback((e, dotId) => {
        e.stopPropagation();
        startDraggingDot(dotId);
    }, [startDraggingDot]);


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
                        <div
                            key={dot.id}
                            className={styles.dot}
                            style={{
                                left: dot.x - 10,
                                top: dot.y - 10,
                            }}
                            onMouseDown={(e) => handleDotMouseDown(e, dot.id)}
                            draggable={false}
                        >
                        </div>
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
        </div>
    );
}

export default SimplifiedFlexParent;