import React, { forwardRef } from 'react';

const SiblingComponent = forwardRef(({ id, neighbors }, ref) => {
  const neighborStatus = {
    top: neighbors.top !== null ? `Sibling Above ${neighbors.top}` : 'No Sibling Above',
    right: neighbors.right !== null ? `Sibling to Right ${neighbors.right}` : 'No Sibling to Right',
    bottom: neighbors.bottom !== null ? `Sibling Below ${neighbors.bottom}` : 'No Sibling Below',
    left: neighbors.left !== null ? `Sibling to Left ${neighbors.left}` : 'No Sibling to Left',
  };

  return (
    <div
      ref={ref}
      style={{
        border: '1px solid black',
        padding: '10px',
        margin: '5px',
        textAlign: 'center',
      }}
    >
      Sibling {id}
      <br />
      {neighborStatus.top}<br />
      {neighborStatus.right}<br />
      {neighborStatus.bottom}<br />
      {neighborStatus.left}
    </div>
  );
});

SiblingComponent.displayName = 'SiblingComponent';

export default SiblingComponent;