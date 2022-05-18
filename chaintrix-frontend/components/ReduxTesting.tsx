import React, { useState, useEffect } from 'react'
import { decrement, selectCount, incrementAsync, selectStatus } from '../store/counterSlice';
import { useAppSelector, useAppDispatch } from '../store/hooks';

const ReduxTesting = (
) => {
    const count = useAppSelector(selectCount);
    const status = useAppSelector(selectStatus)
    const dispatch = useAppDispatch();
    return (
        <div className="box" style={{
            height: '500px', width: '500px', position: 'relative',
            overflow: 'hidden', padding: '0', backgroundColor: '#ffffaf'
        }}>
            <button
                aria-label="Decrement value"
                onClick={() => dispatch(decrement())}
            >decrement</button>
            <p>{count}</p>
            <p>{status}</p>
            <button
                onClick={() => dispatch(incrementAsync(1))}
            >increment async</button>
        </div>

    )
}

export default ReduxTesting;
