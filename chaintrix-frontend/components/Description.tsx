import React from 'react'

const Description = () => {
    return (
        <div className='flex-column margin-padding' style={{}}>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: 'large', marginBottom: 10 }}>
                <img style={{ marginRight: 10 }} src={`/tiles/Tantrix_tile_19.svg`} width={20} height={20} />
                read the rules!
            </div>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: 'large', marginBottom: 10 }}>
                <img style={{ marginRight: 10 }} src={`/tiles/Tantrix_tile_20.svg`} width={20} height={20} />
                test your skills without betting
                {/* try playing without betting */}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: 'large', marginBottom: 10 }}>
                <img style={{ marginRight: 10 }} src={`/tiles/Tantrix_tile_21.svg`} width={20} height={20} />
                <div>
                    bet with Solana (<a href='https://phantom.app/' target="_blank" rel="noopener noreferrer">Phantom</a>) or Hedera (<a href='https://www.hashpack.app/' target="_blank" rel="noopener noreferrer">Hashpack</a>)
                </div>
            </div>
            {/* <div>For Solana, use <a href='https://phantom.app/' target="_blank" rel="noopener noreferrer">Phantom</a>.
                For Hedera, use <a href='https://www.hashpack.app/' target="_blank" rel="noopener noreferrer">Hashpack</a></div> */}
        </div>
    );
}

export default Description;
