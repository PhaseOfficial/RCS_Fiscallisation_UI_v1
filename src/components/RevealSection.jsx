import React from 'react';
import { useInView } from 'react-intersection-observer';

const RevealSection = ({ children }) => {
    const { ref, inView } = useInView({
        threshold: 0.1,
        triggerOnce: true,
    });

    return (
        <div
            ref={ref}
            className={`transition-all duration-700 transform ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
        >
            {children}
        </div>
    );
};

export default RevealSection;
