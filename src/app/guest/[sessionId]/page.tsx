'use client';

import React, { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { GuestView } from '../page';

const GuestPage = () => {
    const params = useParams();
    const sessionId = params?.sessionId as string;

    return (
        <Suspense fallback={<div className="text-white p-4">Carregando...</div>}>
            <GuestView roomIdFromUrl={sessionId} />
        </Suspense>
    );
};

export default GuestPage;
