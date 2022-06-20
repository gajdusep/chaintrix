/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async rewrites() {
        return [{
            source: '/:any*',
            destination: '/',
        }, ];
    },
}

const withTM = require('next-transpile-modules')(['hashconnect']); // pass the modules you would like to see transpiled

module.exports = withTM(nextConfig);