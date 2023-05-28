import { join } from 'path';
import express from 'express';
import { config } from 'dotenv';
import { getRouter } from 'react-documents/dist/src/server';

const PORT = process.env.PORT || 2000;
config();

express()
    .use(express.static(join(process.cwd(), 'src/client/static')))
    .use(getRouter({
        dashboard: { password: process.env.PASSWORD! },
        database: { uri: process.env.MONGO_URI!, name: 'math', rootName: 'Root' },
        modulePath: process.env.NODE_ENV === 'development' ? undefined : 'node_modules/react-documents',
        html: {
            head: '<link rel="stylesheet" href="/style.css"><link rel="manifest" href="/manifest.json">',
            parser: true,
        },
        serviceWorker: { initialCache: ['/style.css', '/manifest.json'] },
    }))
    .listen(PORT, () => console.log('Listening on port', PORT));