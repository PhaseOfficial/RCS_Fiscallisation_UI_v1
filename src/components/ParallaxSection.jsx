import React, { useEffect, useState } from 'react';

const ParallaxSection = ({ children, speed }) => {
    const [offsetY, setOffsetY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setOffsetY(window.scrollY);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div
            className="relative overflow-hidden"
            style={{
                transform: `translateY(${offsetY * speed}px)`,
            }}
        >
            {children}
        </div>
    );
};

export default ParallaxSection;
