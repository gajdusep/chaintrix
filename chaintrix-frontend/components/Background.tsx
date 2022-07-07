import React from 'react'
import { Parallax, ParallaxProvider, useParallax } from 'react-scroll-parallax';

const Background = () => {

    const parallax1 = useParallax({
        rotate: [0, 360],
        translateY: [-300, 100],
    });
    const parallax2 = useParallax({
        translateX: [-100, 200],
        translateY: [10, 200],
        rotate: [10, 200],

    });
    const parallax3 = useParallax({
        translateX: [200, -50],
        translateY: [10, 200],
        rotate: [300, 0],

    });
    const parallax4 = useParallax({
        translateX: [-100, 200],
        translateY: [10, 200],
        rotate: [10, 200],

    });
    const parallax5 = useParallax({
        translateX: [100, -100],
        translateY: [50, 400],
        rotate: [300, 0],

    });
    return (
        <>
            <div style={{ top: 300, left: `30%`, position: 'absolute' }} ref={parallax1.ref as React.RefObject<HTMLDivElement>}>
                <img src={`/tiles/Tantrix_tile_1.svg`} width={100} height={100} />
            </div>
            <div style={{ top: 100, position: 'absolute' }} ref={parallax2.ref as React.RefObject<HTMLDivElement>}>
                <img src={`/tiles/Tantrix_tile_40.svg`} width={200} height={200} />
            </div>
            <div style={{ top: 70, left: `70%`, position: 'absolute' }} ref={parallax3.ref as React.RefObject<HTMLDivElement>}>
                <img src={`/tiles/Tantrix_tile_15.svg`} width={150} height={150} />
            </div>
            <div style={{ top: 20, left: `50%`, position: 'absolute' }} ref={parallax4.ref as React.RefObject<HTMLDivElement>}>
                <img src={`/tiles/Tantrix_tile_41.svg`} width={300} height={300} />
            </div>
            <div style={{ top: 400, left: `0%`, position: 'absolute' }} ref={parallax5.ref as React.RefObject<HTMLDivElement>}>
                <img src={`/tiles/Tantrix_tile_35.svg`} width={250} height={250} />
            </div>
        </>
    );
}

export default Background;
