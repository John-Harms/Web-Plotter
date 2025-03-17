import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import SiblingComponent from './SiblingComponent';

const FlexParent = () => {
  const numberOfSiblings = 20;
  const siblingRefs = useRef([]);
  const [siblingPositions, setSiblingPositions] = useState([]);
  const [siblingRelationships, setSiblingRelationships] = useState([]);
  const [forceUpdate, setForceUpdate] = useState(0);

  useEffect(() => {
    siblingRefs.current = Array(numberOfSiblings).fill().map(() => React.createRef());
    console.log("Refs created:", siblingRefs.current);
    setForceUpdate(prevState => prevState + 1);
  }, [numberOfSiblings]);

  useLayoutEffect(() => {
    const getPositions = () => {
      if (!siblingRefs.current || siblingRefs.current.length === 0) return;

      const allRefsAttached = siblingRefs.current.every(ref => ref.current !== null);

      if (!allRefsAttached) {
        console.log("Not all refs attached yet, rescheduling getPositions.");
        requestAnimationFrame(getPositions);
        return;
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const positions = siblingRefs.current.map((ref, index) => {
            const rect = ref.current.getBoundingClientRect();
            console.log(`Simplified Sibling ${index} Rect:`, rect);
            return { id: index, rect };
          }).filter(pos => pos !== null);

          if (positions.length === numberOfSiblings) {
            setSiblingPositions(positions);
            console.log("Simplified Sibling Positions updated:", positions);
          } else {
            console.log("Positions not fully retrieved, NOT updating state.");
            requestAnimationFrame(getPositions);
          }
        });
      });
    };

    getPositions();
    window.addEventListener('resize', getPositions);
    return () => window.removeEventListener('resize', getPositions);
  }, [siblingRefs, forceUpdate]);


  useEffect(() => {
    console.log("Sibling Positions Input to Relationships:", siblingPositions);
    if (siblingPositions.length === numberOfSiblings) {
      const relationships = siblingPositions.map((siblingPos, index) => {
        const neighbors = { top: null, right: null, bottom: null, left: null };
        let closestRightSiblingDistance = Infinity;
        let closestLeftSiblingDistance = Infinity;
        let closestTopSiblingDistance = Infinity;
        let closestBottomSiblingDistance = Infinity;

        siblingPositions.forEach((otherSiblingPos) => {
          if (otherSiblingPos.id === siblingPos.id) return;

          const rect1 = siblingPos.rect;
          const rect2 = otherSiblingPos.rect;

          const centerX1 = rect1.left + rect1.width / 2;
          const centerY1 = rect1.top + rect1.height / 2;


          // Sibling to the Right
          if (rect2.left > rect1.right && centerY1 >= rect2.top && centerY1 <= rect2.bottom) {
            const distance = rect2.left - rect1.right;
            if (distance < closestRightSiblingDistance) {
              neighbors.right = otherSiblingPos.id;
              closestRightSiblingDistance = distance;
            }
          }

          // Sibling to the Left
          if (rect2.right < rect1.left && centerY1 >= rect2.top && centerY1 <= rect2.bottom) {
            const distance = rect1.left - rect2.right;
            if (distance < closestLeftSiblingDistance) {
              neighbors.left = otherSiblingPos.id;
              closestLeftSiblingDistance = distance;
            }
          }

          // Sibling Below
          if (rect2.top > rect1.bottom && centerX1 >= rect2.left && centerX1 <= rect2.right) {
            const distance = rect2.top - rect1.bottom;
            if (distance < closestBottomSiblingDistance) {
              neighbors.bottom = otherSiblingPos.id;
              closestBottomSiblingDistance = distance;
            }
          }

          // Sibling Above
          if (rect2.bottom < rect1.top && centerX1 >= rect2.left && centerX1 <= rect2.right) {
            const distance = rect1.top - rect2.bottom;
            if (distance < closestTopSiblingDistance) {
              neighbors.top = otherSiblingPos.id;
              closestTopSiblingDistance = distance;
            }
          }
        });
        console.log(`Sibling ${index} Relationships (Raycasting):`, neighbors);
        return { id: siblingPos.id, neighbors };
      });
      setSiblingRelationships(relationships);
      console.log("Sibling Relationships State:", siblingRelationships);
    }
  }, [siblingPositions, numberOfSiblings]);


  return (
    <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', width: '500px', border: '2px solid red' }}>
      {Array.from({ length: numberOfSiblings }).map((_, index) => (
        <SiblingComponent
          key={index}
          id={index}
          ref={siblingRefs.current[index]}
          neighbors={siblingRelationships.find(rel => rel.id === index)?.neighbors || {}}
        />
      ))}
    </div>
  );
};

export default FlexParent;