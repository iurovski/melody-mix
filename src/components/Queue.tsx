import React from 'react';

const Queue = () => {
    return (
        <div className="p-4 bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-white">Fila de Reprodução</h2>
            <ul className="space-y-2">
                <li className="text-gray-400 italic">A fila está vazia.</li>
            </ul>
        </div>
    );
};

export default Queue;
