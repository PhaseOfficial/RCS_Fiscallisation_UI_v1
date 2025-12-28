import React, { useEffect } from 'react';

const BeholdWidget = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://w.behold.so/widget.js';
    document.head.appendChild(script);

    return () => {
      // Cleanup: remove the script if the component unmounts
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div>
      <behold-widget feed-id="itH1B8UOfWB7v0j3Z8lm"></behold-widget>
    </div>
  );
};

export default BeholdWidget;
