import { selectError } from '../store/gameStateSlice';
import { useAppSelector } from '../store/hooks';
import React from 'react'

const ErrorComponent = () => {
    const error = useAppSelector(selectError);


    return (
        <div>Something went wrong: {error}</div>
    )

}

export default ErrorComponent;
