import React, { useEffect, useState } from 'react';
import trackingImage from '../assets/rcs.png';

const TrackingLine = () => {
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="fixed left-8 top-0 h-full w-1 bg-gray-300">
        <img
            src={trackingImage}
            alt="Tracking icon"
            className="w-8 h-8 absolute z-50"
            style={{
                top: 0,
                transform: `translateY(${scrollY * 0.2}px)`,
            }}
        />
    </div>
    );
};

export default TrackingLine;

