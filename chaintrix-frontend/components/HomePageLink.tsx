import React from 'react'
import { Link } from 'react-router-dom';

const HomePageLink = () => {
    return (
        <Link to='/'>
            <div className='flex-row-center margin-padding' >
                <img height={40} src='/others/home.png'></img>
                <div>Homepage</div>
            </div>
        </Link>

    )
}

export default HomePageLink;
